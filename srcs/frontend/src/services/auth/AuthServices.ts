import { RegisterData, ApiResponse } from './types';
export class AuthServices {
    private baseUrl: string;
    // Class constructor
    constructor() {
        this.baseUrl = 'http://localhost:5001/api';
    }
    // Method
    async register(userData: RegisterData): Promise<ApiResponse<any>> {
        try {
            const response = await fetch(`${this.baseUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: userData.username,
                    email: userData.email,
                    password: userData.password
                })
            });
            const data = await response.json();
            console.log('Backend response:', data); // Debug log here
            if (!response.ok) {
                // Extract message from various possible locations
                let msg = data.message || data.errors || data.msg;
                if (!msg && data.validation?.length) {
                    msg = data.validation[0].message;
                }
                console.log('Extracted message:', msg); // Debug log
                return {
                    success: false,
                    status: response.status,
                    message: msg || 'Registration hererererer', // Use the extracted message
                    errors: data.errors || []
                };
            }
            return {
                success: true,
                status: response.status,
                data: data,
                message: data.message || 'Registration successful'
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
export const apiServices = new AuthServices();