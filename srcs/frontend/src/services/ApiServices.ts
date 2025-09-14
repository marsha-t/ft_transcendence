export interface RegisterData{
    username: string;
    email: string;
    password: string;
}

export interface ApiResponse<T>{
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
}

class ApiServices{
    private baseUrl: string;

    //class constructor
    constructor(){
        this.baseUrl = 'http://localhost:3001/api';
    }

    //method
    async register(userData: RegisterData): Promise<ApiResponse<any>>{
        try{
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
                return {
                    success: false,
                    message: data.message || 'Registration failed',
                    errors: data.errors || []
                };
            }

            return {
                success: true,
                data: data,
                message: data.message || 'Registration successfull'
            };
        }catch (error){
            console.error('API error', error);
            return {
                success: false,
                message: 'Network error',
                errors: []
            };
        }
    }
}
export const apiServices = new ApiServices();