import { RegisterData, ApiResponse, LoginApiResponse, LoginData } from './types';

export class AuthServices {
	private baseUrl: string;

	// Class constructor
	constructor() {
		this.baseUrl = '/api/auth';
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
				return {
					success: false,
					status: response.status,
					message: data?.error?.message || 'Registration failed',
					code: data?.error?.code
				};
			}
			return {
				success: true,
				status: response.status,
				data,
				message: data.message || 'Registration successful'
			};
		} catch (error) {
			console.error('Error registering: ', error);
			return {
				success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR'
			};
		}
	}

	// Method for login
	async login(userData: LoginData): Promise<LoginApiResponse<any>> {
		try {
			const response = await fetch(`${this.baseUrl}/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username: userData.username,
					password: userData.password,
				}),
			});
			const data = await response.json();
			if (response.ok) {
				if (data.twoFactorRequired) {
					return {
						success: true,
						status: response.status,
						data,
						message: data.message || '2FA code sent to your email',
						twoFactorRequired: true
					};
				}
				return {
					success: true,
					status: response.status,
					data,
					message: data.message || 'Login successful',
					twoFactorRequired: false
				};
			}
			return {
				success: false,
				status: response.status,
				message: data?.error?.message || "Failed to login",
				code: data?.error?.code,
				twoFactorRequired: false
			};
	
		} catch (error) {
			console.error('Error logging in: ', error);
			return {
				success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR'
			};
		}
	}

	// Google Login 
	async googleLogin(payload: { idToken: string }): Promise<LoginApiResponse<any>> {
		try {
			const response = await fetch(`${this.baseUrl}/google`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
			let data: any = {};
			try { data = await response.json(); } catch { }
			if (response.ok) {
				return {
					success: true,
					status: response.status,
					data,
					message: data.message || 'Google login successful',
					twoFactorRequired: false
				};
			}
			return {
				success: false,
				status: response.status,
				message: data?.error?.message  || 'Google login failed',
				code: data?.error?.code,
				twoFactorRequired: false
			};
		} catch (error) {
			console.error('Error logging in by Google: ', error);
			return {
				success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR'
			};
		}
	}

	// New method for 2FA verification during login
	async login2FA(payload: { username: string; code: string }): Promise<LoginApiResponse<any>> {
		try {
			const response = await fetch(`${this.baseUrl}/login/2fa`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
			let data: any = {};
			try { data = await response.json(); } catch {}
			if (response.ok) {
				return {
					success: true,
					status: response.status,
					data,
					message: data.message || 'Login successful',
					twoFactorRequired: false
				};
			}
			return {
				success: false,
				status: response.status,
				message: data?.error?.message || '2FA verification failed',
				code: data?.error?.code,
				twoFactorRequired: false
			};

		} catch (error) {
			console.error('Error logging in with 2FA: ', error);
			return {
				success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR'
			};
		}
	}

	// Resend OTP
	async resendOTP(payload: { username: string }): Promise<LoginApiResponse<any>> {
		try {
			const response = await fetch(`${this.baseUrl}/login/resend-otp`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
	
			const data = await response.json();
			if (!response.ok) {
				return {
					success: false,
					status: response.status,
					message: data?.error?.message || "Failed to resend OTP",
					code: data?.error?.code
				};
			}
			return {
				success: true,
				status: response.status,
				data,
				message: data.message || 'OTP resent',
				twoFactorRequired: true
			};
		} catch (error) {
			console.error('Error resending OTP: ', error);
			return {
				success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR'
			};
		}
	}

	async get2FAStatus(): Promise<LoginApiResponse<{ enabled: boolean }>> {
		try {
		const response = await fetch(`${this.baseUrl}/2fa/status`, {
			method: 'GET',
			credentials: 'include'
		});
	
		if (!response.ok) {
			const data = await response.json();
			return { success: false, message: data?.error?.message || 'Failed to get 2FA status' };
		}
		const data = await response.json();
		return { 
			success: true, 
			message: "2FA status received",
			data: { enabled: data.enabled },	
		};
		} catch (err) {
			console.error("Error getting 2FA status: ", err);
			return {
				success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR'
			};
		}
	}  

	async enable2FA(): Promise<ApiResponse<null>> {
		try {
			const response = await fetch(`${this.baseUrl}/2fa/enable`, {
				method: "POST",
				credentials: "include",
			});
			let data: any = {};
			try { data = await response.json(); } catch { }
			if (!response.ok) {
				return {
					success: false,
					status: response.status,
					message: data?.error?.message || "Failed to enable 2FA",
				};
			}
			return {
				success: true,
				status: response.status,
				message: data.message || "2FA enabled successfully",
			};
		} catch (error) {
			console.error("Error enabling 2FA: ", error);
			return {
				success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR'
			};
		}
  }

	// Verify 2FA OTP
	async verify2FA(code: string): Promise<ApiResponse<null>> {
		try {
			const response = await fetch(`${this.baseUrl}/2fa/verify`, {
				method: 'POST',
				headers: {
				'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({ code })
			});
			const data = await response.json();
			if (!response.ok) {
				return {
					success: false,
					status: response.status,
					message: data?.error?.message || "Failed to verify 2FA",
					code: data?.error?.code
				};
			}
			return {
				success: true,
				status: response.status,
				message: data.message || "2FA verified successfully",
			};
		} catch (error) {
			console.error("Error verifying 2FA:", error);
			return {
				success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR'
			};
		}
	}

	async disable2FA(): Promise<ApiResponse<null>> {
		try {
		const response = await fetch(`${this.baseUrl}/2fa/disable`, {
			method: "POST",
			credentials: "include",
		});
		let data: any = {};
		try {
			data = await response.json();
		} catch {}
		if (!response.ok) {
			return {
				success: false,
				status: response.status,
				message: data?.error?.message  || "Failed to disable 2FA",
				code: data?.error?.code
			};
		}
		return {
			success: true,
			status: response.status,
			message: data.message || "2FA disabled successfully",
		};
		} catch (error) {
			console.error("Error disabling 2FA:", error);
			return {
				success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR'
			};
		}
	}

	async logout(): Promise<ApiResponse<null>> {
		try {
			const response = await fetch(`${this.baseUrl}/logout`, {
				method: 'POST',
				credentials: 'include',
			});
			let data: any = {};
			try {
				data = await response.json();
			} catch {}
			if (!response.ok) {
				return {
					success: false,
					status: response.status,
					message: data?.error?.message || 'Logout failed',
					code: data?.error?.code
				};
			}
			return {
				success: true,
				status: response.status,
				data: null,
				message: data?.message ?? 'Logout successful'
			};
		} catch (error) {
			console.error('Error logging out: ', error);
			return {
				success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR'
			};
		}
	}

	 async getLoginStatus(): Promise<ApiResponse<{ loggedIn: boolean; username?: string }>> {
        try {
            const response = await fetch(`${this.baseUrl}/loginStatus`, {
                method: 'GET',
                credentials: 'include',
            });
            
            const data = await response.json();
            if (!response.ok) {
                return {
                    success: false,
                    status: response.status,
                    message: data?.error?.message || 'Failed to get login status',
					code: data?.error?.code
                };
            }
            return {
                success: true,
                status: response.status,
                data: data,
                message: 'Login status retrieved successfully'
            };
        } catch (error) {
            console.error('Error getting login status: ', error);
            return {
                success: false,
				status: 0,
				message: "Network error",
				code: 'NETWORK_ERROR'
            };
        }
    }
}

