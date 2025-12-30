// ...existing code...

import { ProfileData, FriendsData,UpdateProfileData, AvatarUploadResponse, AvatarDeleteResponse, UserSearchResult, FriendRequest, MatchHistory, ApiResponse } from './types';

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
  

    // Method to the current user's friends part of the profile page
    async getFriends(): Promise<ApiResponse<FriendsData>> {
        try {
            const response = await fetch(`${this.baseUrl}/friendsServ/friends`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
				        credentials: 'include',
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
          const res = await fetch(`${this.baseUrl}/friendsServ/friends/${encodeURIComponent(username)}`, {
            method: "DELETE",
				    credentials: 'include',
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
    // Method to search for users by username
    async searchUsers(query: string): Promise<ApiResponse<UserSearchResult[]>> {
      try {
          const response = await fetch(`${this.baseUrl}/friendsServ/friends/search?query=${encodeURIComponent(query)}`, {
              method: "GET",
              headers: {
                  "Content-Type": "application/json",
              },
				      credentials: 'include',
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
  
          // Transform API data into frontend format
          const users: UserSearchResult[] = Array.isArray(data)
              ? data.map((u: any) => ({
                    id: u.id,
                    username: u.username,
                    avatar: u.avatar || "/default-avatar.png",
                    friendStatus: u.friendStatus || "not_friend", // include status for button logic
                }))
              : [];
  
          return {
              success: true,
              status: response.status,
              data: users,
              message: "Users fetched successfully",
          };
      } catch (error: any) {
          console.error("API error", error);
          return {
              success: false,
              status: 0,
              message: error?.message || "Network error",
              errors: [],
          };
      }
  }
  async sendFriendRequest(username: string): Promise<ApiResponse<null>> {
    try {
      const userId = 1; // current user id
      const res = await fetch(`${this.baseUrl}/friendsServ/friends/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
				credentials: 'include',
        body: JSON.stringify({ username }),
      });

      if (!res.ok) {
        const err = await res.json();
        return { success: false, message: err.message || "Failed to send request" };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
  
    // Fetch incoming friend requests (users who added me)
    async getIncomingRequests(): Promise<ApiResponse<FriendRequest[]>> {
        try {
        const response = await fetch(`${this.baseUrl}/friendsServ/friends/requests`, {
            method: 'GET',
            headers: {
            'Content-Type': 'application/json',
            },
				    credentials: 'include',
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
  
  // Respond to a friend request (accept/decline)
    async respondToRequest(username: string, action: "accept" | "reject"): Promise<ApiResponse<null>> {
        try {
        const response = await fetch(`${this.baseUrl}/friendsServ/friends/${username}/${action}`, {
            method: 'PUT',
				    credentials: 'include',
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
    async getMatchHistory(userId: number): Promise<ApiResponse<MatchHistory[]>> {
      try {
          const response = await fetch(`${this.baseUrl}/dashboardServ/stats/users/match-history`, {
              method: "GET",
              headers: {
                  "Content-Type": "application/json",
              },
				      credentials: 'include',
          });
          
          const data = await response.json();
          if (!response.ok) {
              return {
                  success: false,
                  status: response.status,
                  message: data.error || data.message || "Failed to fetch match history",
                  errors: data.errors || [],
              };
          }
          const matches: MatchHistory[] = Array.isArray(data)
              ? data.map((m: any) => ({
                date: m.date,
                opponent: m.opponent,
                opponentAvatar: m.opponentAvatar || "/uploads/avatar/default.png",
                userScore: m.userScore,
                opponentScore: m.opponentScore,
                result: m.result === "WIN" ? "WIN" : "LOSS",
                isTournament: Boolean(m.isTournament),
                }))
              : [];
  
          return {
              success: true,
              status: response.status,
              data: matches,
              message: "Users fetched successfully",
          };
      } catch (error: any) {
          console.error("API error", error);
          return {
              success: false,
              status: 0,
              message: error?.message || "Network error",
              errors: [],
          };
      }
  }

  // 2FA Services
  async enable2FA(): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/2fa/enable`, {
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
      const response = await fetch(`${this.baseUrl}/auth/2fa/verify`, {
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
      const response = await fetch(`${this.baseUrl}/auth/2fa/status`, {
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
      const response = await fetch(`${this.baseUrl}/auth/2fa/disable`, {
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