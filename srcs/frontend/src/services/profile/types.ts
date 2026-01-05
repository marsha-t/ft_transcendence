export interface ProfileData {
    id?: number;
    username: string;
    avatar: string;
    email: string;
    hasPassword: boolean;
    isGoogleUser: boolean;
}

export interface UpdateProfileData {
    username?: string;
    oldPassword?: string;
    newPassword?: string;
    newEmail?: string;
}

export interface FriendsData {
    friends?: { avatarURL: string; name: string; online: boolean }[];
}

export interface FriendRequest {
    id: number;
    from?: {
        username: string;
        avatar: string;
        status: string;
    };
}

export interface FriendRequestsData {
    incoming: FriendRequest[];
    outgoing: FriendRequest[];
}

export interface AvatarUploadResponse {
    message: string;
    avatar: string;
}

export interface AvatarDeleteResponse {
    message: string;
    avatar: string;
}
  
export interface UserSearchResult {
    id: number;
    username: string;
    avatar: string;
    friendStatus: 'not_friend' | 'pending_sent';
}

// types.ts
export interface MatchHistory {
    date: string;       
    opponent: string;
    opponentAvatar: string;
    userScore: number;
    opponentScore: number;
    result: "WIN" | "LOSS";
    isTournament: boolean;
  }
  

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    status?: number;
    message?: string;
    errors?: string[]; 
}

