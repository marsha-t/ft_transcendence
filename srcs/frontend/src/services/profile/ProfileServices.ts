// ...existing code...

import { ProfileData, UpdateProfileData, AvatarUploadResponse, AvatarDeleteResponse, ApiResponse } from './types';

export class ProfileServices {
    private baseUrl: string;

    // Class constructor
    constructor() {
        this.baseUrl = '/api';
    }
    
    // Get current user (username + avatar)
    async getCurrentUser(): Promise<ApiResponse<any>> {
        try {
            const response = await fetch(`${this.baseUrl}/profileServ/userInfo`, {
                method: 'GET',
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    status: response.status,
                    message: data.message || 'Failed to get user info',
                    data: null,
                    errors: [],
                };
            }
            
            return {
                success: true,
                status: response.status,
                data: data, // This will be { username: "...", avatar: "..." }
                message: 'User info fetched successfully',
                errors: [],
            };
        } catch (error) {
            console.error('Get current user API error', error);
            return {
                success: false,
                status: 0,
                message: 'Network error',
                data: null,
                errors: [],
            };
        }
    } 
    // Method to get the top part of the profile page
    async getProfile(): Promise<ApiResponse<ProfileData>> {
        try {
            const response = await fetch(`${this.baseUrl}/profileServ/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
				        credentials: 'include',
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
    async uploadAvatarFromPreset(presetPath: string): Promise<ApiResponse<AvatarUploadResponse>> {
    try {
      // Send the preset filename to the backend; backend will copy/set it for the user
      const response = await fetch(`${this.baseUrl}/profileServ/profile/avatar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
				credentials: 'include',
        body: JSON.stringify({ presetFilename: presetPath }),
      });
      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          message: data.message || "Preset avatar set failed",
          errors: [],
        };
      }
      return {
        success: true,
        status: response.status,
        data: data,
        message: "Preset avatar set successfully",
      };
    } catch (error) {
      console.error("API error (preset avatar)", error);
      return {
        success: false,
        status: 0,
        message: "Network error",
        errors: [],
      };
    }
  }
  
    // Method to update the current user's information
    async updateProfile(data: UpdateProfileData): Promise<ApiResponse<any>> {
        try {
          const response = await fetch(`${this.baseUrl}/profileServ/profile`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
				    credentials: 'include',
            body: JSON.stringify(data),
          });
      
          const resData = await response.json();
      
          if (!response.ok) {
            let msg = resData.validation?.[0]?.message || resData.message || resData.error;
            return {
              success: false,
              status: response.status,
              message: msg || "Failed to update profile",
              errors: resData.errors || [],
            };
          }
      
          return {
            success: true,
            status: response.status,
            message: resData.message,
            data: resData.data,
          };
      
        } catch (error) {
          console.error("API error", error);
          return { success: false, status: 0, message: "Network error", errors: [] };
        }
    }
    // Method to update the current user's avatar
    async uploadAvatar(file: File): Promise<ApiResponse<AvatarUploadResponse>> {
        try {
            const formData = new FormData();
            formData.append("file", file);
    
            const response = await fetch(`${this.baseUrl}/profileServ/profile/avatar`, {
                method: "PUT",
			          credentials: 'include',
                body: formData,
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                return {
                    success: false,
                    status: response.status,
                    message: data.message || "Avatar upload failed",
                    errors: [],
                };
            }
    
            return {
                success: true,
                status: response.status,
                data: data,
                message: "Avatar uploaded successfully",
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
    // Method to remove the current user's avatar
    async deleteAvatar(): Promise<ApiResponse<AvatarDeleteResponse>> {
        try {
          const response = await fetch(`${this.baseUrl}/profileServ/profile/avatar`, {
            method: "DELETE",
				    credentials: 'include',
          });
      
          const data = await response.json();
      
          if (!response.ok) {
            return {
              success: false,
              status: response.status,
              message: data.message || "Failed to delete avatar",
              errors: data.errors || [],
            };
          }
      
          return {
            success: true,
            status: response.status,
            message: data.message || "Avatar deleted successfully",
            data: data,
          };
        } catch (error) {
          console.error("API error", error);
          return {
            success: false,
            status: 0,
            message: "Network error",
            errors: [],
          };
        }
    }
}