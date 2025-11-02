import { ApiResponse  } from "../auth/types";
import { Tournament, TournamentStatus, GetNextMatchResponse } from "./types";

export class TournamentService {
	private baseUrl: string;

	constructor(){
		this.baseUrl = 'http://localhost:5001/api';
	}

	getToken(): string | null {
		return localStorage.getItem('jwtToken');
	}

	async updateTournamentStatus(tournamentId: number, status: TournamentStatus): Promise<ApiResponse<Tournament>> {
		try {
			const response = await fetch(`${this.baseUrl}/tournaments/status`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'X-Current-Tournament-Id': String(tournamentId),
					'Authorization': `Bearer ${this.getToken()}`,
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

	async validatePlayer(player: { username: string; password: string}): Promise<ApiResponse<any>> {
		try {
			const response = await fetch(`${this.baseUrl}/tournaments/validate-player`, {
				method: 'POST',
				headers: { 
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.getToken()}`,
				},
				body: JSON.stringify(player),
			});
			const data = await response.json();
			if (!response.ok) {
				let msg = data.validation?.[0]?.message || data.error;
				return {
					success: false,
					status: response.status,
					message: msg || "Failed to validate player",
					errors: data.errors || []
				};
			}
			return { success: true, status: response.status, message: 'Valid player', data };
		} catch (err) {
			console.error ('Error validating player: ', err);
			throw err;
		}
	}

	async finalizeTournament(numberOfPlayers: number, players: any[]): Promise<ApiResponse<any>> {
		try {
			const response = await fetch(`${this.baseUrl}/tournaments/finalize`, {
				method: 'POST',
				headers: { 
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.getToken()}`,
				},
				body: JSON.stringify({ numberOfPlayers, players }),
			});
			
			const data = await response.json();
			if (!response.ok) {
				let msg = data.validation?.[0]?.message || data.error;
				return {
					success: false,
					status: response.status, 
					message: data.error || 'Failed to finalize tournament',
					errors: data.errors || []
				};
			}
			return {
				success: true,
				status: response.status,
				message: "Tournament finalized successfully",
				data,
			};
		} catch (err) {
			console.error('Error finalizing tournament: ', err);
			throw err;
		}
	}

	async getNextMatch(tournamentId: number): Promise<ApiResponse<GetNextMatchResponse>> {
		try {
			const response = await fetch(`${this.baseUrl}/tournaments/next-match`, {
				method: 'GET',
				headers: {
					'X-Current-Tournament-Id': String(tournamentId),
					'Authorization': `Bearer ${this.getToken()}`,
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