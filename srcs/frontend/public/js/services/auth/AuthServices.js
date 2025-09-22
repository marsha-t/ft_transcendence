export class AuthServices {
    constructor() {
        this.baseUrl = 'http://localhost:5001/api';
    }
    async register(userData) {
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
            if (!response.ok) {
                let msg = data.message || data.errors || data.msg;
                if (!msg && data.validation?.length) {
                    msg = data.validation[0].message;
                }
                return {
                    success: false,
                    status: response.status,
                    message: data.message || 'Registration failed',
                    errors: data.errors || []
                };
            }
            return {
                success: true,
                status: response.status,
                data: data,
                message: data.message || 'Registration successfull'
            };
        }
        catch (error) {
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
