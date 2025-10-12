
import { ProfileData, FriendsData,UpdateProfileData, AvatarUploadResponse, AvatarDeleteResponse, UserSearchResult, FriendRequest, ApiResponse } from './types';

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
    async removeFriend(username: string): Promise<ApiResponse<null>> {
        try {
          const res = await fetch(`${this.baseUrl}/friends/${encodeURIComponent(username)}`, {
            method: "DELETE",
            headers: {
              // You may need to include the current user ID header if backend requires it:
              "x-current-user-id": "1", 
            },
          });
      
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.message || "Failed to remove friend");
          }
      
          return { success: true, message: data.message };
        } catch (err) {
          console.error("Error removing friend:", err);
          return { success: false, message: (err as Error).message };
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
    // Method to search for users by username
    async searchUsers(query: string): Promise<ApiResponse<UserSearchResult[]>> {
        try {
            const response = await fetch(`${this.baseUrl}/friends/search?query=${encodeURIComponent(query)}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "x-current-user-id": "1", // replace with dynamic ID later
                },
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    status: response.status,
                    message: data.error || data.message || "Failed to search users",
                    errors: data.errors || [],
                };
            }

            // Transform to your frontend format (username + avatar only)
            const users: UserSearchResult[] = Array.isArray(data)
                ? data.map((u: any) => ({
                    id: u.id,
                    username: u.username,
                    avatar: u.avatar || "/default-avatar.png",
                }))
                : [];

            return {
                success: true,
                status: response.status,
                data: users,
                message: "Users fetched successfully",
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
    // Fetch incoming friend requests (users who added me)
    async getIncomingRequests(): Promise<ApiResponse<FriendRequest[]>> {
        try {
        const response = await fetch(`${this.baseUrl}/friends/requests`, {
            method: 'GET',
            headers: {
            'Content-Type': 'application/json',
            'x-current-user-id': '1',
            },
        });
    
        const data = await response.json();
    
        if (!response.ok) {
            return {
            success: false,
            status: response.status,
            message: data.error || "Failed to fetch incoming requests",
            errors: data.errors || [],
            };
        }
    
        // Format to match frontend
        const requests: FriendRequest[] = data.map((req: any) => ({
            id: req.id,
            from: {
            username: req.from.username,
            avatar: req.from.avatar,
            status: req.from.status,
            },
        }));
    
        return {
            success: true,
            status: response.status,
            data: requests,
            message: "Incoming requests fetched successfully",
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
  
  
//   // Fetch outgoing friend requests (users I sent requests to)
//     async getOutgoingRequests(): Promise<ApiResponse<FriendRequest[]>> {
//         try {
//         const response = await fetch(`${this.baseUrl}/friends/sent`, {
//             method: 'GET',
//             headers: {
//             'Content-Type': 'application/json',
//             'x-current-user-id': '1',
//             },
//         });
    
//         const data = await response.json();
    
//         if (!response.ok) {
//             return {
//             success: false,
//             status: response.status,
//             message: data.error || "Failed to fetch outgoing requests",
//             errors: data.errors || [],
//             };
//         }
    
//         const requests: FriendRequest[] = data.map((req: any) => ({
//             id: req.id,
//             to: {
//             username: req.to.username,
//             avatar: req.to.avatar,
//             status: req.to.status,
//             },
//         }));
    
//         return {
//             success: true,
//             status: response.status,
//             data: requests,
//             message: "Outgoing requests fetched successfully",
//         };
//         } catch (error) {
//         console.error("API error:", error);
//         return {
//             success: false,
//             status: 0,
//             message: "Network error",
//             errors: [],
//         };
//         }
//     }
  
  
  // Respond to a friend request (accept/decline)
    async respondToRequest(username: string, action: "accept" | "reject"): Promise<ApiResponse<null>> {
        try {
        const response = await fetch(`${this.baseUrl}/friends/${username}/${action}`, {
            method: 'PUT',
            headers: {
            'x-current-user-id': '1',
            },
        });
    
        const data = await response.json();
    
        if (!response.ok) {
            return {
            success: false,
            status: response.status,
            message: data.error || `Failed to ${action} request`,
            errors: data.errors || [],
            };
        }
    
        return {
            success: true,
            status: response.status,
            message: data.message || `Request ${action}ed successfully`,
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




