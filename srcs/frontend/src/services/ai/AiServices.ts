// src/services/ai/AiServices.ts
import { ApiResponse, StartGameResponse, AiMoveResponse, AiGameState } from './types';

export class AiServices {
  private baseUrl = '/api/ai'; // ✅ Match the pattern

  async startGame(
    difficulty: 'easy' | 'medium' | 'hard',
    aiSide: 'left' | 'right'
  ): Promise<ApiResponse<StartGameResponse>> {
    try {
      console.log('🎮 Starting AI game:', { difficulty, aiSide });
      
      const res = await fetch(`${this.baseUrl}/game/start`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty, aiSide })
      });

      console.log('📡 Response status:', res.status);
      const data = await res.json();
      console.log('📦 Response data:', data);

      if (!res.ok) {
        return {
          success: false,
          message: data.error || 'Failed to start AI game API',
          status: res.status
        };
      }

      return { success: true, data };
    } catch (err) {
      console.error('❌ AI startGame error:', err);
      return { success: false, message: 'Network error' };
    }
  }

  // async getMove(gameId: number, gameState: AiGameState): Promise<ApiResponse<AiMoveResponse>> {
  //   try {
  //     const res = await fetch(`${this.baseUrl}/game/${gameId}/move`, {
  //       method: 'POST',
  //       credentials: 'include',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(gameState)
  //     });

  //     const data = await res.json();

  //     if (!res.ok) {
  //       return { success: false, message: data.error || 'AI move failed' };
  //     }

  //     return { success: true, data };
  //   } catch (err) {
  //     console.error('AI getMove error:', err);
  //     return { success: false, message: 'Network error' };
  //   }
  // }

  async updateScore(gameId: number, playerScore: number, aiScore: number): Promise<void> {
    await fetch(`${this.baseUrl}/game/${gameId}/score`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerScore, aiScore })
    });
  }

  async finishGame(
    gameId: number,
    winner: 'player' | 'ai',
    playerScore: number,
    aiScore: number
  ): Promise<void> {
    await fetch(`${this.baseUrl}/game/${gameId}/finish`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner, playerScore, aiScore })
    });
  }
}

export const aiServices = new AiServices();