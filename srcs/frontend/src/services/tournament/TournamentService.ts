import { ApiResponse } from "../auth/types";
import { Tournament, TournamentStatus, GetNextMatchResponse } from "./types";

export class TournamentService {
	private baseUrl: string;

	constructor(){
		this.baseUrl = '/api/tournamentServ/tournaments';
	}

	async validatePlayer(player: { username: string; password: string} | { guestName: string} ): Promise<ApiResponse<any>> {
		try {
			const response = await fetch(`${this.baseUrl}/validate-player`, {
				method: 'POST',
				headers: { 
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify(player),
			});
			const data = await response.json();
			if (!response.ok) {
				return {
					success: false,
					status: response.status,
					message: data?.error?.message || "Failed to validate player",
					errors: [],
					code: data?.error?.code
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
			const response = await fetch(`${this.baseUrl}/finalize`, {
				method: 'POST',
				headers: { 
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({ numberOfPlayers, players }),
			});
			
			const data = await response.json();
			if (!response.ok) {
				return {
					success: false,
					status: response.status, 
					message: data?.error?.message || 'Failed to finalize tournament',
					errors: [],
					code: data?.error?.code,
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

	async updateTournamentStatus(tournamentId: number, status: TournamentStatus): Promise<ApiResponse<Tournament>> {
		try {
			const response = await fetch(`${this.baseUrl}/status`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'X-Current-Tournament-Id': String(tournamentId),
				},
				credentials: 'include',
				body: JSON.stringify({ status })
			});
			const data = await response.json();
			if (!response.ok) {
				return {
					success: false,
					status: response.status, 
					message: data?.error?.message || "Failed to update tournament status",
					errors: [],
					code: data?.error?.code
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
			const response = await fetch(`${this.baseUrl}/next-match`, {
				method: 'GET',
				headers: {
					'X-Current-Tournament-Id': String(tournamentId),
				},
				credentials: 'include',
			});
			const data = await response.json();
			if (!response.ok) {
				return {
					success: false, 
					status: response.status,
					message: data?.error?.message || "Failed to fetch next match",
					errors: [],
					code: data?.error?.code
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