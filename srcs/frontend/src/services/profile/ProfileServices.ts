
import { ProfileData, ApiResponse } from './types';

export class ProfileServices {
    private baseUrl: string;

    // Class constructor
    constructor() {
        this.baseUrl = 'http://localhost:5001/api';
    }
    // Method for register
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
}


