export interface ProfileData {
    username: string;
    avatar: string;
    email: string;
}

export interface FriendsData {
    friends?: { avatarURL: string; name: string; online: boolean }[];
}

export interface AvatarUploadResponse {
    message: string;
    avatar: string; // the new avatar URL returned by backend
}

export interface AvatarDeleteResponse {
    message: string;
    avatar: string;
}
  

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    status?: number;
    message?: string;
    errors?: string[]; 
}