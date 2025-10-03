export interface ProfileData {
    username: string;
    avatar: string;
    // email: string;
}

export interface FriendsData {
    friends?: { avatarURL: string; name: string; online: boolean }[];
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    status?: number;
    message?: string;
    errors?: string[]; 
}