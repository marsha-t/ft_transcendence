import { ProfileData, UpdateProfileData, AvatarUploadResponse, AvatarDeleteResponse } from './types';
import { ApiResponse } from "../auth/types";

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
            message: data?.error?.message || 'Failed to get user info',
            code: data?.error?.code,
          };
        }
        return {
          success: true,
          status: response.status,
          data: data,
          message: 'User info fetched successfully',
        };
    } catch (error) {
        console.error('Error getting current user: ', error);
        return {
          success: false,
          status: 0,
          message: 'Network error',
          code: 'NETWORK_ERROR'
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
          return {
            success: false,
            status: response.status,
            message: data?.error?.message || 'Profile fetch failed',
            code: data?.error?.code
          };
        }
        return {
            success: true,
            status: response.status,
            data: data,
            message: 'Profile fetched successfully'
        };
      } catch (error) {
        console.error('Error getting profile: ', error);
        return {
          success: false,
          status: 0,
          message: 'Network error',
          code: 'NETWORK_ERROR'
        };
      }
    }

    async uploadAvatarFromPreset(presetPath: string): Promise<ApiResponse<AvatarUploadResponse>> {
      try {
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
            message: data?.error?.message || "Preset avatar set failed",
            code: data?.error?.code
          };
        }
        return {
          success: true,
          status: response.status,
          data: data,
          message: "Preset avatar set successfully",
        };
      } catch (error) {
        console.error("Error uploading avatar from preset: ", error);
        return {
          success: false,
          status: 0,
          message: 'Network error',
          code: 'NETWORK_ERROR'
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
          return {
            success: false,
            status: response.status,
            message: resData?.error?.message || "Failed to update profile",
            code: resData?.error?.code
          };
        }
        return {
          success: true,
          status: response.status,
          message: resData.message,
          data: resData.data,
        };
      } catch (error) {
        console.error("Error updating user profile: ", error);
        return { 
          success: false,
          status: 0,
          message: "Network error",
          code: 'NETWORK_ERROR'
        };
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
            message: data?.error?.message || "Avatar upload failed",
            code: data?.error?.code
          };
        }
        return {
            success: true,
            status: response.status,
            data: data,
            message: "Avatar uploaded successfully",
        };
      } catch (error) {
          console.error("Error uploading avatar: ", error);
          return {
            success: false,
            status: 0,
            message: "Network error",
            code: 'NETWORK_ERROR'
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
          message: data?.error?.message || "Failed to delete avatar",
          code: data?.error?.code
        };
      }
      return {
        success: true,
        status: response.status,
        message: data.message || "Avatar deleted successfully",
        data: data,
      };
    } catch (error) {
      console.error("Error deleting avatar: ", error);
      return {
        success: false,
        status: 0,
        message: "Network error",
      };
    }
  }
}