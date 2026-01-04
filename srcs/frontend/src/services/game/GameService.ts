import { GameSession, PlayerSide, GameStatus } from "./types";

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

    // 1- Create a new game session
    async createGameSession(side: PlayerSide): Promise<GameSession>{
        try{
            //Send POST request to backend with user + side
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

            if(!response.ok) {
                console.log(`Failed to create game session: ${response.status}`);
                throw new Error(`Failed to create game session: ${response.status}`);
            }

            //get data from backend and  Parse JSON response
            const data = await response.json();
            //transform data into game session, Convert raw API data → GameSession object
            return this.transformApiResponseToGameSession(data);
        }catch(error){
            console.error('Error creating game session:', error);
            throw error;
        }
    }

    // 2- add a guest player to an existing session
    async addGuestPlayer(sessionId: number, guestName: string | null, playerUserId: number | null, side: PlayerSide): Promise<void>{
        try{
            const response = await fetch(`${this.baseUrl}/gameSessionPlayersServ/game-sessions/players`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Current-Session-Id': String(sessionId),
                },
				credentials: 'include',
                body: JSON.stringify({
                    guestName,
                    playerUserId,
                    side
                })
            });

            if(!response.ok) {
                let message = `Error to add guest player: ${response.status}`;
                if (response.status === 409) {
                    try {
                        const data = await response.json();
                        if (data?.error) {
                            message = data.error;
                        }
                    } catch { // keep generic message
                    }
                }
                // Create error object with extra status field
                const err = new Error(message) as Error & { status?: number }; 
                err.status = response.status;
                throw err;
            }
        }catch(error){
            console.log('Error adding guest player:', error);
            throw error;
        }
    }
    // 3- update game session status
    async updateGameStatus(sessionId: number, status: GameStatus): Promise<GameSession> {
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

            if (!response.ok) {
                let errorMessage = `Failed to update game status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    console.error('Backend error details:', errorData);
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (e) {
                    // Response wasn't JSON
                }
                throw new Error(errorMessage);            }

            const data = await response.json();
            return this.transformApiResponseToGameSession(data);
        } catch (error) {
            console.error('Error updating game status:', error);
            throw error;
        }
    }
    // 4- update player score
    async updatePlayerScore(sessionId: number, scoringSide: PlayerSide): Promise<GameSession>{
        try{
            const response = await fetch(`${this.baseUrl}/gameSessionPlayersServ/game-sessions/players/score`, {
               method: 'PATCH',
               headers: {
                    'X-Current-Session-Id': String(sessionId),
                    'X-Player-Side': scoringSide,
               },
				credentials: 'include',
            });
            if(!response.ok)
                throw new Error(`Failed to update player score: ${response.status}`);
            const data = await response.json();
            return data;
        }catch(error){
            console.log("Error updating player score"), console.error();
                throw error
        }
    }
    // 6- Start game
    async startGame(sessionId: number):Promise<GameSession>{
        return this.updateGameStatus(sessionId, "PLAYING");
    }

    // 7- Pause game;
    async pauseGame(sessionId: number): Promise<GameSession> {
        return this.updateGameStatus(sessionId, "PAUSED");
    }

    // 8- Abort game
    async abortGame(sessionId: number): Promise<GameSession> {
        return this.updateGameStatus(sessionId, "ABORTED");
    }

    // 10- Transform API response to match our GameSession interface
    private transformApiResponseToGameSession(apiResponse: any){
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