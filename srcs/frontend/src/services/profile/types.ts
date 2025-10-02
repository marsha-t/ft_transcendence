export interface ProfileData {
    username: string;
    avatar: string;
}

export interface FriendsData {
    friends?: { initials: string; name: string; online: string }[];
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    status?: number;
    message?: string;
    errors?: string[]; 
}