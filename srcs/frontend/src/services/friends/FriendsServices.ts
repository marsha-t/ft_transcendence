import { FriendsData, UserSearchResult, FriendRequest } from './types';
import { ApiResponse } from "../auth/types";

export class FriendsServices {
	private baseUrl: string;

	// Class constructor
	constructor() {
		this.baseUrl = '/api';
	}

	async sendFriendRequest(username: string): Promise<ApiResponse<null>> {
		try {
			const response = await fetch(`${this.baseUrl}/friendsServ/friends/send`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: 'include',
				body: JSON.stringify({ username }),
			});
			let data: any = null;
			try {
				data = await response.json();
			} catch {}
			if (!response.ok) {
				return {
					success: false,
					status: response.status,
					message: data?.error?.message || "Failed to send friend request",
					code: data?.error?.code
				};
			}
			return { 
				success: true,
				status: response.status,
				message: data?.message ?? "Friend request successfully sent"
			};
		} catch (err: any) {
			console.error('Error sending friend request: ', err);
			return { 
				success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR' 
			};
		}
	}

	// Respond to a friend request (accept/decline)
	async respondToRequest(username: string, action: "accept" | "reject"): Promise<ApiResponse<null>> {
		try {
			const response = await fetch(`${this.baseUrl}/friendsServ/friends/${username}/${action}`, {
				method: 'PUT',
				credentials: 'include',
			});
			let data: any = null;
			try {
			data = await response.json();
			} catch {}
			if (!response.ok) {
				return {
					success: false,
					status: response.status,
					message: data?.error?.message  || `Failed to ${action} request`,
					code: data?.error?.code
				};
			}
			return {
				success: true,
				status: response.status,
				message: data?.message ?? `Request ${action}ed successfully`,
			};
		} catch (error) {
			console.error("Error responding to request:", error);
			return {
				success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR'
			};
		}
	}

	async removeFriend(username: string): Promise<ApiResponse<null>> {
		try {
			const response = await fetch(`${this.baseUrl}/friendsServ/friends/${encodeURIComponent(username)}`, {
				method: "DELETE",
				credentials: 'include',
			});
			let data: any = null;
			try {
				data = await response.json();
			} catch {}
			if (!response.ok) {
				return {
					success: false,
					status: response.status,
					message: data?.error?.message || "Failed to remove friend",
					code: data?.error?.code
				};
			}
		  	return { 
				success: true, 
				status: response.status,
				message: data?.message ?? 'Friend removed successfully'
			};
		} catch (err) {
			console.error("Error removing friend:", err);
			return { 
				success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR' 
			};
		}
	}

	// Method to the current user's friends part of the profile page
	async getFriends(): Promise<ApiResponse<FriendsData>> {
		try {
			const response = await fetch(`${this.baseUrl}/friendsServ/friends`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
			});
			const data = await response.json();
			if(!response.ok){
				return {
					success: false,
					status: response.status,
					message: data?.error?.message || 'Friends fetch failed',
					code: data?.error?.code
				};
			}
			// Transform backend response into your frontend format
			const friendsArray = Array.isArray(data) ? data : [];
			const friends = friendsArray.map((f: any) => ({
				avatarURL: f.avatar,
				name: f.username,
				online: f.status === "ONLINE"
			}));
			return {
				success: true,
				status: response.status,
				data: { friends },
				message: 'Friends fetched successfully'
			};
		} catch (error) {
			console.error('Error getting friends: ', error);
			return {
				success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR'
			};
		}
	}
	
	// Fetch incoming friend requests (users who added me)
	async getIncomingRequests(): Promise<ApiResponse<FriendRequest[]>> {
		try {
		const response = await fetch(`${this.baseUrl}/friendsServ/friends/requests`, {
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
				message: data?.error?.message || "Failed to fetch incoming requests",
				code: data?.error?.code
			};
		}
		// Format to match frontend
		const requests: FriendRequest[] = data.map((req: any) => ({
			id: req.id,
			from: {
				username: req.from.username,
				avatar: req.from.avatar,
				status: req.from.status,
			},
		}));
		return {
			success: true,
			status: response.status,
			data: requests,
			message: "Incoming requests fetched successfully",
		};
		} catch (error) {
			console.error("Error getting incoming request: ", error);
			return {
				success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR'
			};
		}
	}
  
	// Method to search for users by username
	async searchUsers(query: string): Promise<ApiResponse<UserSearchResult[]>> {
		try {
			const response = await fetch(`${this.baseUrl}/friendsServ/friends/search?query=${encodeURIComponent(query)}`, {
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
					message: data?.error?.message  || "Failed to search users",
					code: data?.error?.code
				};
			}
			// Transform API data into frontend format
			const users: UserSearchResult[] = Array.isArray(data)
				? data.map((u: any) => ({
					id: u.id,
					username: u.username,
					avatar: u.avatar || "/default-avatar.png",
					friendStatus: u.friendStatus || "not_friend",
				}))
				: [];
			return {
				success: true,
				status: response.status,
				data: users,
				message: "Users fetched successfully",
			};
		} catch (error) {
			console.error("Error searching: ", error);
			return {
				success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR'
			};
		}
	}
}