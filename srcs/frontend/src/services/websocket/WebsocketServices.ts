import { GameState, AIMove } from "./types";

export class AIWebSocketService {

    private isConnecting =  false;
    private socket: WebSocket | null = null;
    private sessionId: number | null = null;
    private reconnectDelay = 2000; //20 sec;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private messageHandlers: Map<string, (data: any) => void> = new Map();
    private stateStreamInterval: number | null = null;


    constructor (){}

    //1) COnnect to AI websocket server

    public async connect(sessionId: number): Promise<void> {
        if(this.isConnecting || (this.socket && this.socket.readyState === WebSocket.OPEN)){
            console.warn('[AIWebSocket] Already connected or connecting');
            return;
        }

        this.isConnecting = true;
        this.sessionId = sessionId;

        return new Promise((resolve, reject)=> {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const wsUrl = `${protocol}//${window.location.host}/ws/ai/${sessionId}`;
          console.log(`[AIWebSocket] Connecting to ${wsUrl}`);

            try{
                this.socket = new WebSocket(wsUrl);

                this.socket.onopen = ()=>{
                    console.log(`[AIWebSocket] Connected to session ${sessionId}`);
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;
                    resolve();
                };

                // this.socket.onmessage = (error) => {
                //     console.error('[AIWebSocket] Error:', error);
                //     this.isConnecting = false;
                //     reject(error);
                // };
                this.socket.onmessage = (event) => {
                  this.handleMessage(event);
                };

                this.socket.onerror = (error) => {
                  console.error('[AIWebSocket] Error:', error);
                  this.isConnecting = false;
                  reject(error);
                };

                this.socket.onclose = (event) => {
                    console.log(`[AIWebSocket] Disconnected: ${event.code} - ${event.reason}`);
                    this.isConnecting = false;
                    this.handleDisconnect(event);
                };
            }catch (err){
                this.isConnecting = false;
                reject(err);
            }
        });
    }

    //2)  Handle incoming WebSocket messages

  private handleMessage(event: MessageEvent): void {
      try{

          const message = JSON.parse(event.data);
          console.log(`[AIWebSocket] Received message type: ${message.type}`);

          // Route to registered handlers FIRST
          const handler = this.messageHandlers.get(message.type);
          if(handler)
              handler(message.data);

          // Then handle built-in message types
          switch(message.type){
              case 'ai_ready':
                  console.log('[AIWebSocket] AI is ready!');
                  break;
              case 'ai_move':
                  // Handler registered by PongGame will process this
                  break;
              case 'pong':
                  // Heartbeat response
                  break;
              case 'error':
                  console.error('[AIWebSocket] Server error:', message.message);
                  break;
          }

      }catch (err){
          console.error('[AIWebSocket] Failed to parse message:', err);
      }
  }

    //3 Register a message handler for specific message types
    public on(messageType: string, handler: (data: any) => void): void {
        this.messageHandlers.set(messageType, handler);
      }

      
    //4 Remove a message handler
    public off(messageType: string): void {
        this.messageHandlers.delete(messageType);
      }


      //5 Send game state to backend (called every frame from PongGame)

      public sendGameState(gameState: GameState): void {
        if(!this.socket || this.socket.readyState !== WebSocket.OPEN){
            console.warn('[AIWebSocket] Cannot send - socket not open');
            return;
        }

        try{
            this.socket.send(JSON.stringify({
                type: 'game_state',
                data: gameState
            }));

        }catch(err){

            console.error('[AIWebSocket] Failed to send game state:', err);

        }
      }

      //6 Send game constants once at start

      public sendGameStart(constants: any): void {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn('[AIWebSocket] Cannot send game_start - socket not open');
            return;
          }
      
          console.log('[AIWebSocket] Sending game constants');

          this.socket.send(JSON.stringify({
            type: 'game_start',
            data: {constants}
          }));
      }


      //7 Send ping to keep connection alive

      public sendPing(): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ type: 'ping' }));
        }
      }

      //8 Handle disconnection and attempt reconnect
      private handleDisconnect(event: CloseEvent): void {
        this.stopStateStream();

        // Don't reconnect if it was a clean close (user quit)
        if(event.code === 1000 || event.code === 4403 || event.code === 4404 || event.code === 4409) {
            console.log('[AIWebSocket] Clean disconnect - not reconnecting');
            return;

        }
        // Attempt reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts && this.sessionId) {
            this.reconnectAttempts++;
            console.log(`[AIWebSocket] Reconnecting attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            
            setTimeout(() => {
              if (this.sessionId) {
                this.connect(this.sessionId).catch(err => {
                  console.error('[AIWebSocket] Reconnection failed:', err);
                });
              }
            }, this.reconnectDelay * this.reconnectAttempts);
          } else {
            console.error('[AIWebSocket] Max reconnection attempts reached');
        }

      }

      //9  Start streaming game state at regular intervals

      public startStateStream(getGameState: () => GameState, intervalMs: number = 50): void {
        this.stopStateStream();
        
        this.stateStreamInterval = window.setInterval(() => {
          const state = getGameState();
          this.sendGameState(state);
        }, intervalMs);
    
        console.log(`[AIWebSocket] Started state streaming every ${intervalMs}ms`);
      }

      //10 Stop streaming game state
      public stopStateStream(): void {
        if (this.stateStreamInterval !== null) {
          clearInterval(this.stateStreamInterval);
          this.stateStreamInterval = null;
          console.log('[AIWebSocket] Stopped state streaming');
        }
      }

      //11 Disconnect and cleanup
      public disconnect(): void {
        console.log('[AIWebSocket] Disconnecting...');
        
        this.stopStateStream();
        
        if (this.socket) {
          // Send game_end before closing
          if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'game_end' }));
          }
          
          this.socket.close(1000, 'Client disconnect');
          this.socket = null;
        }
    
        this.messageHandlers.clear();
        this.sessionId = null;
        this.reconnectAttempts = 0;
      }


      //12 Check if connected
      public isConnected(): boolean {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
      }

      //13 Get connection state
      public getReadyState(): number | null {
        return this.socket ? this.socket.readyState : null;
      }

}

export const aiWebSocketService = new AIWebSocketService();

