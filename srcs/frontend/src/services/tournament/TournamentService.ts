import { ApiResponse  } from "../auth/types";
import { Tournament, PlayerJoin, Player, TournamentStatus, GetNextMatchResponse } from "./types";

export class TournamentService {
	private baseUrl: string;

	constructor(){
		this.baseUrl = 'http://localhost:5001/api';
	}

	async createTournament(userId: number, numberOfPlayers: number): Promise<ApiResponse<any>> {
		try {
			const response = await fetch(`${this.baseUrl}/tournaments`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-current-user-id': String(userId),
				}, 
				body: JSON.stringify({
					numberOfPlayers,
				})
			});
			const data = await response.json();
			if (!response.ok) {
				let msg = data.validation?.[0]?.message || data.error;
                return {
                    success: false,
                    status: response.status,
                    message: msg || 'Failed to create tournament',
                    errors: data.errors || [],
                };
			}
			return {
				success: true,
				status: response.status,
				message: "Tournament created successfully",
				data
			};
		} catch(err) {
			console.error('Error creating tournament: ', err);
			throw err;
		}
	}

	async addTournamentPlayer(tournamentId: number, player: PlayerJoin): Promise<ApiResponse<Player>> {
		try {
			const response = await fetch(`${this.baseUrl}/tournaments/players`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Current-Tournament-Id': String(tournamentId),
				},
				body: JSON.stringify(player)
			});
			const data = await response.json();
			if (!response.ok) {
			    let msg = data.validation?.[0]?.message || data.error;
				return {
					success: false,
					status: response.status,
					message: msg || "Failed to add tournament player",
					errors: data.errors || [],
				};
			}
			return {
				success: true, 
				status: response.status,
				message: "Player added successfully",
				data
			};
		} catch (err) {
			console.error('Error adding tournament player: ', err);
			throw err;
		}
	}

	async updateTournamentStatus(tournamentId: number, status: TournamentStatus): Promise<ApiResponse<Tournament>> {
		try {
			const response = await fetch(`${this.baseUrl}/tournaments/status`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'X-Current-Tournament-Id': String(tournamentId),

				},
				body: JSON.stringify({ status })
			});
			const data = await response.json();
			if (!response.ok) {
				let msg = data.validation?.[0]?.message || data.error;
				return {
					success: false,
					status: response.status, 
					message: msg || "Failed to update tournament status",
					errors: data.errors || []
				};
			}
			return {
				success: true,
				status: response.status,
				message: "Tournament status updated successfully",
				data,
			}
		} catch (err) {
			console.error('Error updating tournament status: ', err);
			throw err;
		}
	}

	async getNextMatch(tournamentId: number): Promise<ApiResponse<GetNextMatchResponse>> {
		try {
			const response = await fetch(`${this.baseUrl}/tournaments/next-match`, {
				method: 'GET',
				headers: {
					'X-Current-Tournament-Id': String(tournamentId),
				},
			});
			const data = await response.json();
			if (!response.ok) {
				let msg = data.validation?.[0]?.message || data.error;
				return {
					success: false, 
					status: response.status,
					message: msg || "Failed to fetch next match",
					errors: data.errors || [],
				};
			}
			return {
				success: true, 
				status: response.status,
				message: "Next match fetched successfully",
				data,
			};
		} catch (err) {
			console.error('Error getting next match: ', err);
			throw err;
		}
	}
}