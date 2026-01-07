import { RegisterData, ApiResponse, LoginApiResponse, LoginData, Login2FAData } from './types';

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
    
            // Safely parse JSON
            let data: any = {};
            try {
                data = await response.json();
            } catch {
                data = {};
            }
    
            // Success case -------------------
            if (response.ok) {
                // If 2FA required, return that info to frontend
                if (data.twoFactorRequired) {
                    return {
                        success: true,
                        status: response.status,
                        data: data,
                        message: data.message || '2FA code sent to your email',
                        errors: [],
                        twoFactorRequired: true
                    };
                }
    
                return {
                    success: true,
                    status: response.status,
                    data: data,
                    message: data.message || 'Login successful',
                    errors: [],
                    twoFactorRequired: false
                };
            }
    
            // Error case
            let msg = data.validation?.[0]?.message || data.error || 'Login failed';
            return {
                success: false,
                status: response.status,
                message: msg,
                errors: data.errors || [],
                data: null,
                twoFactorRequired: false
            };
    
        } catch (error) {
            console.error('Login API error', error);
            return {
                success: false,
                status: 0,
                message: 'Login API, network error',
                errors: [],
                data: null,
                twoFactorRequired: false
            };
        }
    }

    async logout(): Promise<ApiResponse<null>> {
        try {
            const response = await fetch(`${this.baseUrl}/logout`, {
                method: 'POST',
                        credentials: 'include',
            });
            const data = await response.json();
  
            if (!response.ok) {
                const msg = data.error || 'Logout failed';
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
                data: null,
                message: 'Logout successful'
            };
        } catch (error) {
            console.error('Logout API error', error);
            return {
                success: false,
                status: 0,
                message: 'Network error',
                errors: []
            };
        }
      }

    // ⚡ New method for 2FA verification during login
    async login2FA(payload: { username: string; code: string }): Promise<LoginApiResponse<any>> {
        try {
            const response = await fetch(`${this.baseUrl}/login/2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            let data: any = {};
            try { data = await response.json(); } catch { data = {}; }

            if (response.ok) {
                return {
                    success: true,
                    status: response.status,
                    data: data,
                    message: data.message || 'Login successful',
                    errors: [],
                    twoFactorRequired: false
                };
            }

            let msg = data.message || data.error || '2FA verification failed';
            return {
                success: false,
                status: response.status,
                message: msg,
                errors: data.errors || [],
                data: null,
                twoFactorRequired: false
            };

        } catch (error) {
            console.error('2FA API error', error);
            return {
                success: false,
                status: 0,
                message: '2FA API network error',
                errors: [],
                data: null,
                twoFactorRequired: false
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
            return {
                success: response.ok,
                status: response.status,
                data,
                message: data.message || 'OTP resent',
                errors: [],
                twoFactorRequired: true
            };
        } catch (error) {
            console.error('Resend OTP API error', error);

            return {
                success: false,
                status: 0,
                message: 'Network error',
                errors: [],
                data: null,
                twoFactorRequired: true
            };
        }
    }

    // ------------------ NEW: Google Login ------------------
    async googleLogin(payload: { idToken: string }): Promise<LoginApiResponse<any>> {
        try {
            const response = await fetch(`${this.baseUrl}/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            let data: any = {};
            try { data = await response.json(); } catch { data = {}; }

            if (response.ok) {
                return {
                    success: true,
                    status: response.status,
                    data: data,
                    message: data.message || 'Google login successful',
                    errors: [],
                    twoFactorRequired: false
                };
            }

            let msg = data.message || data.error || 'Google login failed';
            return {
                success: false,
                status: response.status,
                message: msg,
                errors: data.errors || [],
                data: null,
                twoFactorRequired: false
            };
        } catch (error) {
            console.error('Google login API error', error);
            return {
                success: false,
                status: 0,
                message: 'Google login network error',
                errors: [],
                data: null,
                twoFactorRequired: false
            };
        }
    }

      // 2FA Services
  async enable2FA(): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(`${this.baseUrl}/2fa/enable`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          message: data.error || "Failed to enable 2FA",
          errors: data.errors || [],
        };
      }

      return {
        success: true,
        status: response.status,
        message: data.message || "2FA enabled successfully",
      };
    } catch (error) {
      console.error("API error:", error);
      return {
        success: false,
        status: 0,
        message: "Network error",
        errors: [],
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
          message: data.error || data.message || "Failed to verify 2FA",
          errors: data.errors || [],
        };
      }

      return {
        success: true,
        status: response.status,
        message: data.message || "2FA verified successfully",
      };
    } catch (error) {
      console.error("API error:", error);
      return {
        success: false,
        status: 0,
        message: "Network error",
        errors: [],
      };
    }
  }

  async get2FAStatus(): Promise<{ success: boolean; enabled?: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/2fa/status`, {
        method: 'GET',
        credentials: 'include' // send cookies automatically
      });
  
      if (!response.ok) {
        const data = await response.json();
        return { success: false, message: data.message || 'Failed to get 2FA status' };
      }
  
      const data = await response.json();
      return { success: true, enabled: data.enabled };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Network error' };
    }
  }  

  async disable2FA(): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(`${this.baseUrl}/2fa/disable`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          message: data.error || "Failed to disable 2FA",
          errors: data.errors || [],
        };
      }

      return {
        success: true,
        status: response.status,
        message: data.message || "2FA disabled successfully",
      };
    } catch (error) {
      console.error("API error:", error);
      return {
        success: false,
        status: 0,
        message: "Network error",
        errors: [],
      };
    }
  }
}

export const apiServices = new AuthServices();
