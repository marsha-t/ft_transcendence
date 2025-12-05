import gameStateStore from "./gameStateStore.js";
import prisma from '../prisma/prismaClient.js'
import aiBrain from "./aiBrain.js";

/**
 * Accepts WebSocket connections from Frontend
 * Receives game state data (ball position, paddle position)
 * Stores it in gameStateStore
 * Will send AI moves back to Frontend
 * 
 * handleConnections:
 *  Step 1: Verify this is actually an AI game
 *  Check if session exists
 *  Check if it's an AI game
 */
class AIWebSocketHandler{

    constructor (){
        this.activeSockets = new Map(); // Key = sessionId, Value = socket object
        this.aiBrains = new Map(); // Key = sessionId, Value = AIBrain instance
    }

    async handleConnections(socket, sessionId, userId){

        console.log(`{BE AI} handleConnections`);
        console.log(`{BE AI} New connection: session=${sessionId}, user=${userId}`);

        try{
            const session = await prisma.gameSession.findUnique({
                where: {id: Number(sessionId)},
                include: {players: true}
            });

            if(!session){
                console.error(`{BE AI} Session ${sessionId} not found`);
                socket.send(JSON.stringify({
                    type: 'error',
                    message: 'Game session not found'
                }));
                socket.close();
                return;
            }

            if(!session.isAi){
                console.error(`{BE AI} Session ${sessionId} is not an AI game`);
                socket.send(JSON.stringify({
                    type: 'error',
                    message: 'This is not AI game'
                }));
                socket.close();
                return;
            }

            //Store socket connections
            this.activeSockets.set(sessionId, socket);
            console.log(`{BE AI} Session ${sessionId} connected. Active sessions: ${this.activeSockets.size}`);

            // Create a brain for this session
            this.aiBrains.set(sessionId, new aiBrain());
            
            //Listen to FE
            socket.on('message', (rawData) => {
                this.handleMessage(socket, sessionId, rawData);
            });

            //check for connection close
            socket.on('close', () =>{
                console.log(`{BE AI} Session ${sessionId} disconnected`);
                this.cleanup(sessionId);
            });

            socket.on('error', (error) => {
                console.error(`{BE AI} Session ${sessionId} error:`, error);
                this.cleanup(sessionId);
            });

            //Here WS sends 'ready' signal mess. to FE
            socket.send(JSON.stringify({
                type: 'ai_ready',
                message: 'AI WebSocket connected!'
            }));

        } catch(err){
            console.error(`{BE AI} Connection error:`, err);
            socket.send(JSON.stringify({
                type: 'error',
                message: 'Internal Server error'
            }));
            socket.close();
        }

    }

    /**
   * Handle incoming messages from Frontend
   * Frontend can send different types of messages (game_state, ping, etc.)
   */

    handleMessage(socket, sessionId, rawData){
        console.log("here handleMessage was called ")
        try{
            const message = JSON.parse(rawData.toString()); // rawData is a Buffer (binary data), convert to string first


            //handle diff types of message
            switch(message.type){
                case 'game_state':
                    this.handleGameState(sessionId, message.data);
                    break;

                case 'ping':
                    socket.send(JSON.stringify({type: 'pong'}));
                    break;

                case 'game_start': // Frontend is starting the game, sending constants
                    console.log(`{BE AI} Game ${sessionId} started`);
                    if(message.data && message.data.constants)
                        this.handleGameStart(sessionId, message.data.constants);
                    break;

                case 'game_end':
                    console.log(`{BE AI} Game ${sessionId} ended`);
                    this.cleanup(sessionId);
                    break;

                default:
                    console.warn(`{BE AI} Unknown message type: ${message.type}`);
            }
        }catch (err){
            console.error(`{BE AI} Error handling message:`, err);
            socket.send(JSON.stringify({
                type: 'error',
                message: 'Failed to process message'
            }));
        }
    }


    /**
   * Handle game state update from Frontend
   * This is called 20-60 times per second!
   * 
   * store game state on gameStateStore class
   */

    handleGameState(sessionId, gameState){
        console.log(`{BE AI} Received state for session ${sessionId}`); 
        try{
            gameStateStore.update(sessionId, gameState); //saving to gameStateStore class
    
            const shouldLog = Date.now() % 5000 < 50;
            if(shouldLog) {
                console.log(`{BE AI} Session ${sessionId} - Ball: (${gameState.ball.x.toFixed(2)}, ${gameState.ball.z.toFixed(2)})`);
                console.log(`{BE AI} Session ${sessionId} - AI Paddle Z: ${gameState.aiPaddle?.z || 'N/A'}`);
            }
    
            const brain = this.aiBrains.get(sessionId);
            
            if (!brain) {
                console.error(`{BE AI} No brain found for session ${sessionId}`);
                return;
            }

            //Get the full state with constants from store
            const fullState = gameStateStore.getState(sessionId);
        
            if (!fullState || !fullState.constants) {
                console.warn(`{BE AI} Constants not yet available for session ${sessionId}`);
                return;
            }

            const action = brain.decide(gameState);
            
            if (shouldLog) {
                console.log(`{BE AI} Session ${sessionId} - AI decided action: ${action}`);
            }
            
            this.sendAIMove(sessionId, action);
    
        } catch(err){
            console.error(`[AIWebSocket] Error storing game state:`, err);
        }
    }
    /**
   * Handle game start - store constants once
   * Constants don't change during the game, so we only need them once
   */

    handleGameStart(sessionId, constants){
        try{

            const currentState = gameStateStore.getState(sessionId);

            if(currentState){
                currentState.constants = constants;
                console.log(`{BE AI} Session ${sessionId} - Constants stored`);
            }else{
                gameStateStore.update(sessionId, {
                    ball: { x: 0, z: 0, vx: 0, vz: 0 },
                    arena: {zMin: -4.4, zMax: 4.4 },
                    aiPaddle: { x: 9.5, z: 0 },
                    oppPaddle: {x: -9.5, z: 0, vz: 0 },
                    constants: constants
                });
            }
        }catch (err){
            console.error(`{BE AI} Error storing constants:`, error);
        }
    }


    // calculateAIMove(gameState)
    sendAIMove(sessionId, action){
        try {
            const socket = this.activeSockets.get(sessionId);
            
            // Check if socket exists and is open
            if (!socket) {
              console.warn(`{BE AI} No socket for session ${sessionId}`);
              return;
            }
      
            // WebSocket readyState: 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED
            if (socket.readyState !== 1) {
              console.warn(`{BE AI} Socket for session ${sessionId} is not open (state: ${socket.readyState})`);
              return;
            }
      
            // Send AI move to Frontend
            socket.send(JSON.stringify({
              type: 'ai_move',
              data: {
                action
              }
            }));
      
          } catch (error) {
            console.error(`{BE AI} Error sending AI move:`, error);
        }
    }


    cleanup(sessionId){
        this.activeSockets.delete(sessionId);
        this.aiBrains.delete(sessionId);
        gameStateStore.removeState(sessionId);
    }

    getActiveConnections(){
        return this.activeSockets.size;
    }

    isConnected(sessionId){
        return this.activeSockets.has(sessionId);
    }
}

const aiWebSocketHandler = new AIWebSocketHandler();
export default aiWebSocketHandler;