import gameStateStore from "./gameStateStore.js";
import aiBrain from "./aiBrain.js";

/*
 * Accepts WebSocket connections from Frontend
 * Receives game state data (ball position, paddle position)
 * Stores it in gameStateStore
 * Sends state to AI brain to decide move
 * Sends AI's move back to Frontend
 * 
 */
class AIWebSocketHandler{

    constructor (){
        this.activeSockets = new Map(); // Key = sessionId, Value = socket object
        this.aiBrains = new Map(); // Key = sessionId, Value = AIBrain instance
    }

    // Initialise AI runtime for specific game session
    /*
        - Store socket in activeSockets map
        - Create new brain and store in aiBrains map
        - Attach listeners for message, close and error
            - for message, delegate to handleMessage()
            - for close, call cleanUp()
            - for error, log and call cleanUp()
        - Send 'ai_ready' message to frontend
        - Errors are logged and sockets closed 
    */
    async handleConnections(socket, sessionId){

        try{
            this.activeSockets.set(sessionId, socket);
            this.aiBrains.set(sessionId, new aiBrain());
            
            // Listen to Frontend
            socket.on('message', (rawData) => {
                this.handleMessage(socket, sessionId, rawData);
            });
            socket.on('close', () =>{
                this.cleanup(sessionId);
            });
            socket.on('error', (error) => {
                console.error(`[WebSocket] Session ${sessionId} error:`, error);
                this.cleanup(sessionId);
            });

            // Send ready message to frontend
            socket.send(JSON.stringify({
                type: 'ai_ready',
                message: 'AI WebSocket connected!'
            }));

        } catch(err){
            console.error(`[WebSocket] Connection error:`, err);
            socket.close(4500, "Internal server error");
        }
    }

    // Handle incoming messages from frontend
    /*
    - Different types of messages from frontend
        - game_state: live game snapshot
        - game_start: initial constants
        - ping: connection keep-alive
        - game_end: cleanup trigger
    - Errors logged and JSON message sent to frontend
   */
    handleMessage(socket, sessionId, rawData){
        try{
            const message = JSON.parse(rawData.toString()); // rawData is a Buffer (binary data), convert to string first

            switch(message.type){
                case 'game_state':
                    this.handleGameState(sessionId, message.data);
                    break;

                case 'ping':
                    socket.send(JSON.stringify({type: 'pong'}));
                    break;

                case 'game_start':
                    if(message.data && message.data.constants)
                        this.handleGameStart(sessionId, message.data.constants);
                    break;

                case 'game_end':
                    this.cleanup(sessionId);
                    break;

                default:
                    console.warn(`[WebSocket] Unknown message type: ${message.type}`);
                    socket.send(
                        JSON.stringify({
                        type: "error",
                        message: "Unknown message type",
                        })
                    );
            }
        } catch (err){
            console.error(`[WebSocket] Error handling message:`, err);
            socket.send(JSON.stringify({
                type: 'error',
                message: 'Failed to process message'
            }));
        }
    }

    // Handle game start
    /*
    - Store constants in gameStateStore at start of game
    - If state already exists, replace constants part of state
    - If state doesn't exist, update gameStateStore with dummy values for non-constant fields
    - Errors are logged - non critical failure
    */
    handleGameStart(sessionId, constants){
        try{

            const currentState = gameStateStore.getState(sessionId);

            if(currentState){
                currentState.constants = constants; // getState() returns a reference and hence this is updating gameStateStore
            }else{
                gameStateStore.update(sessionId, {
                    ball: { x: 0, z: 0, vx: 0, vz: 0 },
                    arena: {zMin: -4.4, zMax: 4.4 },
                    aiPaddle: { x: 9.5, z: 0 },
                    oppPaddle: {x: -9.5, z: 0, vz: 0 },
                    constants: constants
                });
            }
        } catch (err){
            console.error(`[WebSocket] Error storing constants:`, err);
        }
    }

    // Handle game state update from frontend 
    /*
    - This may be called up to 60 times per second
    - Overwrite gameState in gameStateStore
    - Defensively guard against constants not being in fullState - allow AI to wait for required inputs
    - Error 
        - Missing brain: critical error: log error and close socket
        - Other errors: log error
   */
    handleGameState(sessionId, gameState){
        try{
            gameStateStore.update(sessionId, gameState);
    
            const brain = this.aiBrains.get(sessionId);
            if (!brain) {
                console.error(`[WebSocket] No brain found for session ${sessionId}`);
                const socket = this.activeSockets.get(sessionId);
                if (socket && socket.readyState == 1) {
                    socket.close(4500, "AI brain unavailable");
                }
                this.cleanup(sessionId);
                return;
            }

            //Get the full state with constants from store
            const fullState = gameStateStore.getState(sessionId);
            if (!fullState.constants) {
                // Not an error - possible for messages to arrive out of order
                return;
            }

            const action = brain.decide(fullState);
            this.sendAIMove(sessionId, action);
    
        } catch(err){
            console.error(`[AIWebSocket] Error storing game state:`, err);
        }
    }

    // Send AI opponent's move to frontend
    /*
        - Check that socket exists and is open
            - If not, early return (e.g., frontend closed tab, game ends naturally)
        - Send AI opponet's move to frontend
        - Error logged without JSON message since already error sending AI move
    */
    sendAIMove(sessionId, action){
        try {
            const socket = this.activeSockets.get(sessionId);
            
            // Check if socket exists and is open
            if (!socket || socket.readyState !== 1) { // WebSocket readyState: 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED
              return;
            }
      
            socket.send(JSON.stringify({
              type: 'ai_move',
              data: {
                action
              }
            }));
      
          } catch (error) {
            console.error(`[WebSocket] Error sending AI move:`, error);
        }
    }

    // Clean up for each session
    /*
        - Remove socket from map
        - Delete AI Brain (garbage collector will deallocate it)
        - Remove gameState from gameStateStore
    */
    cleanup(sessionId){
        this.activeSockets.delete(sessionId);
        this.aiBrains.delete(sessionId);
        gameStateStore.removeState(sessionId);
    }

    isConnected(sessionId){
        return this.activeSockets.has(sessionId);
    }
}

const aiWebSocketHandler = new AIWebSocketHandler();
export default aiWebSocketHandler;