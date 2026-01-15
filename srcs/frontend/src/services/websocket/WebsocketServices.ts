import { GameState } from "./types";

/**
 * Manages WebSocket connection for AI opponent game mode
 * Handles real-time communication between client and AI service
 * 
 * Features:
 * - Auto-reconnection on connection loss
 * - Send game state snapshots to the backend AI service
 * - Receive and route AI-related messages via registered handlers
 * - Handle connection loss and attempt controlled reconnection
 * - Provide explicit cleanup on game exit
 */
export class AIWebSocketService {

    private isConnecting =  false;
    private socket: WebSocket | null = null;
    private sessionId: number | null = null;
    private reconnectDelay = 2000;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private messageHandlers: Map<string, (data: any) => void> = new Map();
    private stateStreamInterval: number | null = null;

    constructor (){}

    /**
   * Establish a WebSocket connection to the AI service for a given session.
   * - Prevents duplicate connections
   * - Resolves once the socket is fully open
   * - Registers internal event handlers
   */
    public async connect(sessionId: number): Promise<void> {
        if(this.isConnecting || (this.socket && this.socket.readyState === WebSocket.OPEN)){
            console.warn('[AIWebSocket] Already connected or connecting');
            return;
        }

        this.isConnecting = true;
        this.sessionId = sessionId;

        return new Promise((resolve, reject)=> {
          const wsUrl = `wss://${window.location.host}/ws/ai/${sessionId}`;

            try{
                this.socket = new WebSocket(wsUrl);

                this.socket.onopen = ()=>{
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;
                    resolve();
                };

                this.socket.onmessage = (event) => {
                  this.handleMessage(event);
                };

                this.socket.onerror = (error) => {
                  console.error('[AIWebSocket] Error:', error);
                  this.isConnecting = false;
                  reject(error);
                };

                this.socket.onclose = (event) => {
                    this.isConnecting = false;
                    this.handleDisconnect(event);
                };
            }catch (err){
                this.isConnecting = false;
                reject(err);
            }
        });
    }

  // Handle incoming WebSocket messages.
  private handleMessage(event: MessageEvent): void {
      try{

          const message = JSON.parse(event.data);

          // Route to registered handlers FIRST
          const handler = this.messageHandlers.get(message.type);
          if(handler){
            handler(message.data);
          }

          switch(message.type){
              case 'ai_ready':
                  break;
              case 'ai_move':
                  break;
              case 'pong':
                  break;
              case 'error':
                  console.error('[AIWebSocket] Server error:', message.message);
                  break;
          }
      }catch (err){
          console.error('[AIWebSocket] Failed to parse message:', err);
      }
  }

  // Register a callback for a specific message type.
  public on(messageType: string, handler: (data: any) => void): void {
      this.messageHandlers.set(messageType, handler);
    }
  
  // Send the current game state snapshot to the AI service.
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

  // Send immutable game configuration data to the AI service.
  public sendGameStart(constants: any): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        console.warn('[AIWebSocket] Cannot send game_start - socket not open');
        return;
      }
    this.socket.send(JSON.stringify({
      type: 'game_start',
      data: {constants}
    }));
  }

  /**
   * Handle WebSocket disconnection.
   * - Stops any active state streaming
   * - Skips reconnection for intentional/authorized closures
   * - Attempts controlled reconnection for unexpected disconnects
   */
  private handleDisconnect(event: CloseEvent): void {
    this.stopStateStream();

    // Do not reconnect on intentional or authorization-related closes
    if(event.code === 1000 || event.code === 4401 || event.code === 4403 || event.code === 4404 || event.code === 4409) {
        return;
    }
    // Attempt reconnection
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.sessionId) {
        this.reconnectAttempts++;
        
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

  // Stop any active interval-based game state streaming.
  public stopStateStream(): void {
    if (this.stateStreamInterval !== null) {
      clearInterval(this.stateStreamInterval);
      this.stateStreamInterval = null;
    }
  }

  // Explicitly terminate the WebSocket connection and release resources.
  public disconnect(): void {
    
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
}