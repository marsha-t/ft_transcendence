import { GameSession, PlayerSide, GameStatus } from "./types";
import { ApiResponse } from "../auth/types";

export class AIService{
	private baseUrl: string;

	constructor(){
		this.baseUrl = '/api';
	}

	// Create a new game session with AI opponent
	async createAIGame(): Promise<ApiResponse<GameSession>>{
		try {
			const response = await fetch(`${this.baseUrl}/ai/game`, {
				method: 'POST',
				credentials: 'include',
			});
			const data = await response.json();
			if(!response.ok) {
				return {
					success: false,
					status: response.status,
					message: data?.error?.message || "Failed to create AI game",
					code: data?.error?.code
				};
			}
			return {
				success: true, 
				status: response.status, 
				message: 'AI game created', 
				data: this.transformAiResponseToGameSession(data),
			};
		} catch(error) {
			console.error('Error creating AI session: ', error);
			return {
				success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR'
			};
		}
	}

	// Transform API response to match GameSession interface
	private transformAiResponseToGameSession(apiResponse: any): GameSession {
		return {
		sessionId: apiResponse.sessionId.toString(),
		status: "PLAYING" as GameStatus,
		players: apiResponse.players.map((p: any) => ({
			side: p.side as PlayerSide,
			displayName: p.displayName,
			score: p.score ?? 0,
			guestName: p.isGuest ? p.displayName : undefined,
		})),
		createdAt: new Date().toISOString(),
		};
  	}
}