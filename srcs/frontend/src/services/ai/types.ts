// src/services/ai/types.ts
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    status?: number;
    data?: T;
    error?: string;
  }
  
  // This is what your backend actually returns from /game/start
  export interface StartGameResponse {
    success: boolean;
    gameId: number;
    difficulty: string;
    aiSide: string;
  }
  
  // This is what your backend returns from /game/:id/move
  export interface AiMoveResponse {
    move: 'UP' | 'DOWN' | 'NONE';
    timestamp: number;
  }
  
  // Exact shape you send to backend
  export interface AiGameState {
    gameState: {
      ball: {
        x: number;
        z: number;
        velocityX: number;
        velocityZ: number;
      };
      playerPaddle: {
        x: number;
        z: number;
      };
      aiPaddle: {
        x: number;
        z: number;
      };
      tableBounds: {
        zMin: number;
        zMax: number;
      };
    };
  }