import { GameSession, PlayerSide, GameStatus } from "./types";
import { ApiResponse } from "../auth/types";

/**
 * GameService
 * 
 * PURPOSE:
 * - Handles all HTTP communication with the game backend API
 * - Manages game session lifecycle (create, start, pause, abort)
 * - Updates player scores and tracks game state
 * - Transforms raw API responses into type-safe GameSession objects
 * 
 * RESPONSIBILITIES:
 * - CRUD operations for game sessions
 * - Player management (adding guests, updating scores)
 * - Status transitions (CREATED → PLAYING → FINISHED)
 * - Error handling and validation
 * 
 * USED BY: Game.ts, AI.ts, TournamentMatch.ts
 **/ 
export class GameService{
    private baseUrl: string;

    constructor(){
        this.baseUrl = '/api';
    }

    // Create a new game session
    async createGameSession(side: PlayerSide): Promise<ApiResponse<GameSession>>{
        try {
            const response = await fetch(`${this.baseUrl}/gameSessionServ/game-sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
				credentials: 'include',
                body: JSON.stringify({
                    side
                })
            });
            const data = await response.json();
            if(!response.ok) {
                return {
					success: false,
					status: response.status,
					message: data?.error?.message || "Failed to create new game",
					code: data?.error?.code
				};
            }
            return {
                success: true, 
                status: response.status, 
                message: 'New game created', 
                data: this.transformApiResponseToGameSession(data),
            };
        } catch(error) {
            console.error('Error creating game session: ', error);
            return {
				success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR'
			};
        }
    }

    // Update game session status
    async updateGameStatus(sessionId: number, status: GameStatus): Promise<ApiResponse<GameSession>> {
        try {
            const response = await fetch(`${this.baseUrl}/gameSessionServ/game-sessions/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Current-Session-Id': String(sessionId),
                },
				credentials: 'include',
                body: JSON.stringify({
                    status
                })
            });
            const data = await response.json();
            if (!response.ok) {
                return {
                    success: false,
                    status: response.status,
                    message:
                    data?.error?.message || "Failed to update game session status",
                    code: data?.error?.code,
                };
            }
            return {
                success: true,
                status: response.status,
                message: "Game status updated",
                data: this.transformApiResponseToGameSession(data),
            }
        } catch (error) {
            console.error('Error updating game status: ', error);
            return {
				success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR'
			};
        }
    }

    // Add a guest player to an existing session
    async addGuestPlayer(sessionId: number, guestName: string, side: PlayerSide): Promise<ApiResponse<null>>{
        try {
            const response = await fetch(`${this.baseUrl}/gameSessionPlayersServ/game-sessions/players`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Current-Session-Id': String(sessionId),
                },
				credentials: 'include',
                body: JSON.stringify({
                    guestName,
                    side
                })
            });
            let data: any = null;
            try {
                data = await response.json();
            } catch {}
            if(!response.ok) {
                return {
					success: false,
					status: response.status,
					message: data?.error?.message || "Failed to add guest player",
					code: data?.error?.code
				};
            }
            return {
                success: true,
                status: response.status,
                message: "Guest player added",
            };
        } catch(error) {
            console.error('Error adding guest player: ', error);
            return {
				success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR'
			};
        }
    }
    
    // Update player score
    async updatePlayerScore(sessionId: number, scoringSide: PlayerSide): Promise<ApiResponse<GameSession>>{
        try{
            const response = await fetch(`${this.baseUrl}/gameSessionPlayersServ/game-sessions/players/score`, {
               method: 'PATCH',
               headers: {
                    'X-Current-Session-Id': String(sessionId),
                    'X-Player-Side': scoringSide,
               },
				credentials: 'include',
            });
            const data = await response.json();
            if (!response.ok) {
                return {
                    success: false,
                    status: response.status,
                    message: data?.error?.message || "Failed to update score",
                    code: data?.error?.code,
                };
            }
            return {
                success: true,
                status: response.status,
                message: "Score updated",
                data,
            };
        } catch(error) {
            console.error("Error updating player score: ", error);
            return {
				success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR'
			};
        }
    }

    // Start game
    async startGame(sessionId: number){
        return this.updateGameStatus(sessionId, "PLAYING");
    }

    // Pause game;
    async pauseGame(sessionId: number) {
        return this.updateGameStatus(sessionId, "PAUSED");
    }

    // Abort game
    async abortGame(sessionId: number){
        return this.updateGameStatus(sessionId, "ABORTED");
    }

    // Transform API response to match GameSession interface
    // Needed because backend responses across routes are not shaped like GameSession interfaces
    private transformApiResponseToGameSession(apiResponse: any): GameSession {
        return {
            sessionId: apiResponse.id.toString(),
            status: apiResponse.status as GameStatus,
            players: apiResponse.players.map((player: any) => ({
                userId: player.userId?.toString(),
                guestName: player.isGuest ? player.displayName : undefined,
                side: player.side as PlayerSide,
                score: player.score,
                displayName: player.displayName
            })),
            winner: apiResponse.winnerPlayerId ? 
                apiResponse.players.find((p: any) => p.id === apiResponse.winnerPlayerId)?.side : 
                undefined,
            createdAt: apiResponse.createdAt,
            startedAt: apiResponse.startedAt,
            endedAt: apiResponse.endedAt
        };
    }
}