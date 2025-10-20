import { RegisterData, ApiResponse, LoginData } from './types';


export class AuthServices {
    private baseUrl: string;

    // Class constructor
    constructor() {
        this.baseUrl = 'http://localhost:5001/api';
    }
    // Method for register
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
            if(!response.ok){
                let msg = data.validation?.[0]?.message || data.message || data.error;
                return {
                    success: false,
                    status: response.status,
                    message: msg || 'Registration failed',
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

     // Method for login

    async login(userData: LoginData): Promise<ApiResponse<any>> {
        try {
            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: userData.username,
                    password: userData.password,
                }),
            });
    
            // Try to parse JSON safely to get backend data
            let data: any = {};
            try {
                data = await response.json();
            } catch {
                data = {};
            }
    
            //if response is not correct
            if (!response.ok) {
                let msg = data.validation?.[0]?.message || data.error;
                // if (!msg && Array.isArray(data.errors)) {
                //     msg = data.errors[0]?.message || 'Login Unknown error';
                // }
    
                return {
                    success: false,
                    status: response.status,
                    message: msg || 'Login failed',
                    errors: data.errors || [],
                };
            }
    
            // Success case
            return {
                success: true,
                status: response.status,
                data: data,
                message: data.message || 'Login successful'
            };
        } catch (error) {
            console.error('Login API error', error);
            return {
                success: false,
                status: 0,
                message: 'Login API, network error',
                errors: [],
            };
        }
    }
    
}
export const apiServices = new AuthServices();