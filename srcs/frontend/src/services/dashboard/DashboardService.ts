import { ApiResponse } from "../auth/types";
import { GameDashboard } from "./types";

export class DashboardService {
	private baseUrl: string;

	constructor() {
		this.baseUrl = 'http://localhost:5001/api';
	}

	async getGameDashboard(sessionId: number): Promise<ApiResponse<GameDashboard> {
		try {
			const response = await fetch(`${this.baseUrl}/stats/game`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'X-Current-Session-Id': String(sessionId),
				}
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
}