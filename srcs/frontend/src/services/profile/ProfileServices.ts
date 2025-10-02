
import { ProfileData, FriendsData, ApiResponse } from './types';

export class ProfileServices {
    private baseUrl: string;

    // Class constructor
    constructor() {
        this.baseUrl = 'http://localhost:5001/api';
    }
    // Method to get the top part of the profile page
    async getProfile(): Promise<ApiResponse<ProfileData>> {
        try {
            const response = await fetch(`${this.baseUrl}/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-current-user-id': '1',
                },
            });
            const data = await response.json();
            if(!response.ok){
                let msg = data.error || 'Profile fetch failed';
                return {
                    success: false,
                    status: response.status,
                    message: msg,
                    errors: data.errors || []
                };
            }
            return {
                success: true,
                status: response.status,
                data: data,
                message: 'Profile fetched successfully'
            };
        } catch (error) {
            console.error('API error', error);
            return {
                success: false,
                status: 0,
                message: 'Network error',
                errors: []
            };
        }
    }
    // Method to the current user's friends part of the profile page
    async getFriends(): Promise<ApiResponse<FriendsData>> {
        try {
            const response = await fetch(`${this.baseUrl}/friends`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-current-user-id': '1',
                },
            });
            const data = await response.json();
            if(!response.ok){
                let msg = data.error || 'Friends fetch failed';
                return {
                    success: false,
                    status: response.status,
                    message: msg,
                    errors: data.errors || []
                };
            }

            // Transform backend response into your frontend format
            const friends = data.map((f: any) => ({
                avatarURL: f.avatar,
                name: f.username,
                online: f.status === "ONLINE"   // convert string → boolean
            }));
            return {
                success: true,
                status: response.status,
                data: { friends },
                message: 'Friends fetched successfully'
            };
        } catch (error) {
            console.error('API error', error);
            return {
                success: false,
                status: 0,
                message: 'Network error',
                errors: []
            };
        }
    }
}




