import { ApiResponse } from "../auth/types";
import { GameDashboard, UserDashboard , MatchHistory} from "./types";

export class DashboardService {
	private baseUrl: string;

	constructor() {
		this.baseUrl = '/api';
	}
	
	// Get play counts for heatmap
	async getPlayCounts(startDate: string, endDate: string): Promise<ApiResponse<Array<{date: string, count: number}>>> {
		try {
			const response = await fetch(
				`${this.baseUrl}/dashboardServ/stats/play-counts?start=${startDate}&end=${endDate}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
				}
			);
			const data = await response.json();
			if (!response.ok) {
				return {
					success: false,
					status: response.status, 
					message: data?.error?.message || "Failed to fetch play counts",
					code: data?.error?.code
				};
			}
			return {
				success: true,
				status: response.status,
				message: "Play counts fetched successfully",
				data,
			};
		} catch (err) {
			console.error('Error fetching play counts: ', err);
			return {
				success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR'
			};
		}
	}

	async getGameDashboard(sessionId: number): Promise<ApiResponse<GameDashboard>> {
		try {
			const response = await fetch(`${this.baseUrl}/dashboardServ/stats/game`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'X-Current-Session-Id': String(sessionId),
				},
				credentials: 'include',
			});
			const data = await response.json();
			if (!response.ok) {
				return {
					success: false,
					status: response.status, 
					message: data?.error?.message || "Failed to fetch game dashboard",
					code: data?.error?.code
				};
			}
			return {
				success: true,
				status: response.status,
				message: "Game dashboard fetched successfully",
				data,
			}
		} catch (err) {
			console.error('Error fetching game dashboard: ', err);
			return {
				success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR'
			};
		}
	}
	
	async getUserDashboard(): Promise<ApiResponse<UserDashboard>> {
		try {
			const response = await fetch(`${this.baseUrl}/dashboardServ/stats/user`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
			});
			const data = await response.json();
			if (!response.ok) {
				return {
					success: false,
					status: response.status, 
					message: data?.error?.message || "Failed to fetch user dashboard",
					code: data?.error?.code
				};
			}
			return {
				success: true,
				status: response.status,
				message: "User dashboard fetched successfully",
				data,
			}
		} catch (err) {
			console.error('Error fetching user dashboard: ', err);
			return {
				success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR'
			};
		}
	}

	async getMatchHistory(): Promise<ApiResponse<MatchHistory[]>> {
		try {
			const response = await fetch(`${this.baseUrl}/dashboardServ/stats/users/match-history`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: 'include',
			});
			
			const data = await response.json();
			if (!response.ok) {
				return {
					success: false,
					status: response.status,
					message: data?.error?.message || "Failed to fetch match history",
					code: data?.error?.code
				};
			}
			const matches: MatchHistory[] = Array.isArray(data)
				? data.map((m: any) => ({
				date: m.date,
				opponent: m.opponent,
				opponentAvatar: m.opponentAvatar || "/uploads/avatar/default.png",
				userScore: m.userScore,
				opponentScore: m.opponentScore,
				result: m.result === "WIN" ? "WIN" : "LOSS",
				isTournament: Boolean(m.isTournament),
				}))
				: [];
	
			return {
				success: true,
				status: response.status,
				data: matches,
				message: "Users fetched successfully",
			};
		} catch (error: any) {
			console.error("Error fetching match history: ", error);
			return {
				success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR'
			};
		}
	}
}