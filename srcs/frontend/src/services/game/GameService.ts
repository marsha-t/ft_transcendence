import { GameSession, PlayerSide, GameStatus } from "./types";

export class GameService{
    private baseUrl: string;

    constructor(){
        this.baseUrl = 'http://localhost:5001/api';
    }

    // 1- Create a new game session
    async createGameSession(userId: number, side: PlayerSide): Promise<GameSession>{
        try{
            const response = await fetch(`${this.baseUrl}/game-sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    side
                })
            });

            if(!response.ok)
                throw new Error(`Failed to create game session: ${response.status}`);

            //get data from backend
            const data = await response.json();
            //transform data into game session
            return this.transformApiResponseToGameSession(data);
        }catch(error){
            console.error('Error creating game session:', error);
            throw error;
        }
    }

    // 2- add a guest player to an existing session
    async addGuestPlayer(sessionId: string, guestName: string, side: PlayerSide): Promise<void>{
        try{
            const response = await fetch(`${this.baseUrl}/game-sessions/${sessionId}/player`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    guestName,
                    side
                })
            });

            if(!response.ok)
                throw new Error(`Error to add guest player: ${response.status}`);
        }catch(error){
            console.log('error adding guest player:', error);
            throw error;
        }
    }
    // 3- uptade game session status
    async updateGameStatus(sessionId: string, status: GameStatus): Promise<GameSession> {
        try {
            const response = await fetch(`${this.baseUrl}/game-sessions/${sessionId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
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
    // 4- uptade player score
    async updatePlayerScore(sessionId: string, scoringSide: PlayerSide): Promise<void>{
        
    }
    // 5- Get game session by ID
    async getGameSession(sessionId: string): Promise<GameSession> {
        try {
            const response = await fetch(`${this.baseUrl}/game-sessions/${sessionId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get game session: ${response.status}`);
            }

            const data = await response.json();
            return this.transformApiResponseToGameSession(data);
        } catch (error) {
            console.error('Error getting game session:', error);
            throw error;
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
    // 9- Finish game
    async finishGame(sessionId: string): Promise<GameSession> {
        return this.updateGameStatus(sessionId, "FINISHED");
    }
    // 10- Transform API response to match our GameSession interface
    async transformApiResponseToGameSession(apiResponse: any){
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
                undefined
        };
    }
    // helper fun to handel API errors
}