
import { ProfileData, FriendsData, UpdateProfileData, AvatarUploadResponse, AvatarDeleteResponse, ApiResponse } from './types';

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
            const friendsArray = Array.isArray(data.friends) ? data.friends : [];
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
    // Method to update the current user's information
    async updateProfile(data: UpdateProfileData): Promise<ApiResponse<any>> {
        try {
          const response = await fetch(`${this.baseUrl}/profile`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "x-current-user-id": "1", // or dynamically get user ID
            },
            body: JSON.stringify(data),
          });
      
          const resData = await response.json();
      
          if (!response.ok) {
            return {
              success: false,
              status: response.status,
              message: resData.message || "Failed to update profile",
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
    
            const response = await fetch(`${this.baseUrl}/profile/avatar`, {
                method: "PUT",
                headers: {
                    "x-current-user-id": "1",
                },
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
          const response = await fetch(`${this.baseUrl}/profile/avatar`, {
            method: "DELETE",
            headers: {
              "x-current-user-id": "1", // or dynamically from auth
            },
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




