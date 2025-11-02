import { GameSession, PlayerSide, GameStatus } from "./types";

export class GameService{
    private baseUrl: string;

    constructor(){
        this.baseUrl = 'http://localhost:5001/api';
    }

    getToken(): string | null {
      return localStorage.getItem('jwtToken');
    }

    // 1- Create a new game session
    async createGameSession(userId: number, side: PlayerSide): Promise<GameSession>{
        try{
            //Send POST request to backend with user + side
            const response = await fetch(`${this.baseUrl}/game-sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`,
                },
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
    async addGuestPlayer(sessionId: string, guestName: string | null, playerUserId: number | null, side: PlayerSide): Promise<void>{
        try{
            const response = await fetch(`${this.baseUrl}/game-sessions/players`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Current-Session-Id': String(sessionId),
                    'Authorization': `Bearer ${this.getToken()}`,
                },
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
    async updateGameStatus(sessionId: string, status: GameStatus): Promise<GameSession> {
        try {
            const response = await fetch(`${this.baseUrl}/game-sessions/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Current-Session-Id': String(sessionId),
                    'Authorization': `Bearer ${this.getToken()}`,
                },
                body: JSON.stringify({
                    status
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to update game status: ${response.status}`);
            }

            const data = await response.json();
            return this.transformApiResponseToGameSession(data);
        } catch (error) {
            console.error('Error updating game status:', error);
            throw error;
        }
    }
    // 4- update player score
    async updatePlayerScore(sessionId: string, scoringSide: PlayerSide): Promise<GameSession>{
        try{
            const response = await fetch(`${this.baseUrl}/game-sessions/players/score`, {
               method: 'PATCH',
               headers: {
                    'X-Current-Session-Id': String(sessionId),
                    'X-Player-Side': scoringSide,
                    'Authorization': `Bearer ${this.getToken()}`,
               } 
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
    async startGame(sessionId: string):Promise<GameSession>{
        return this.updateGameStatus(sessionId, "PLAYING");
    }
    // 7- Pause game;
    async pauseGame(sessionId: string): Promise<GameSession> {
        return this.updateGameStatus(sessionId, "PAUSED");
    }
    // 8- Abort game
    async abortGame(sessionId: string): Promise<GameSession> {
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
    // helper fun to handel API errors
    private handleApiError(response: Response, context: string): never {
        switch (response.status) {
            case 400:
                throw new Error(`${context}: Invalid request data`);
            case 404:
                throw new Error(`${context}: Resource not found`);
            case 409:
                throw new Error(`${context}: Conflict (e.g., side already taken)`);
            case 500:
                throw new Error(`${context}: Server error`);
            default:
                throw new Error(`${context}: Unexpected error (${response.status})`);
        }
    }
}