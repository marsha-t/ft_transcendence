export interface ProfileData {
    username: string;
    avatar: string;
    email: string;
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

    // to?: {
    //     username: string;
    //     avatar: string;
    //     status: string;
    // };
}

export interface FriendRequestsData {
    incoming: FriendRequest[];
    outgoing: FriendRequest[];
}

export interface AvatarUploadResponse {
    message: string;
    avatar: string; // the new avatar URL returned by backend
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

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    status?: number;
    message?: string;
    errors?: string[]; 
}

