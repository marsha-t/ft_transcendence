export class WebsocketServices {
    private ws: WebSocket | null;
    private sessionId: number | null = null;
    private isConnected: boolean = false;
    private reconnectAttemps: number = 0;
    private maxReconnectAttempts: number = 5;
    private onAIMoveCallback?: (paddleZ: number) => void;

    constructor(){}

    
}