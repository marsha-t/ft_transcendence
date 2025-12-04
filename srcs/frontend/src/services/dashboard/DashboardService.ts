import { ApiResponse } from "../auth/types";
import { GameDashboard, UserDashboard } from "./types";

export class DashboardService {
	private baseUrl: string;

	constructor() {
		this.baseUrl = '/api';
	}
	
	getToken(): string | null {
		return localStorage.getItem('jwtToken');
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
				let msg = data.validation?.[0]?.message || data.error;
				return {
					success: false,
					status: response.status, 
					message: msg || "Failed to fetch play counts",
					errors: data.errors || []
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
				status: 500,
				message: "Network error fetching play counts",
				errors: []
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
				let msg = data.validation?.[0]?.message || data.error;
				return {
					success: false,
					status: response.status, 
					message: msg || "Failed to fetch game dashboard",
					errors: data.errors || []
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
			throw err;
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
				let msg = data.validation?.[0]?.message || data.error;
				return {
					success: false,
					status: response.status, 
					message: msg || "Failed to fetch user dashboard",
					errors: data.errors || []
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
			throw err;
		}
	}
}