import { ApiResponse } from "../auth/types";
import { GameDashboard, UserDashboard } from "./types";

export class DashboardService {
	private baseUrl: string;

	constructor() {
		this.baseUrl = '/api';
	}

	async getGameDashboard(sessionId: number): Promise<ApiResponse<GameDashboard>> {
		try {
			const response = await fetch(`${this.baseUrl}/stats/game`, {
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
	
	async getUserDashboard(userId: number): Promise<ApiResponse<UserDashboard>> {
		try {
			const response = await fetch(`${this.baseUrl}/stats/user`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'X-Current-User-Id': String(userId),
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