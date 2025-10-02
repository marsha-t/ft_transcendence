export interface ProfileData {
    username: string;
    avatar: string;
    friends?: { initials: string; name: string; online: boolean }[];
    requests?: { initials: string; name: string }[];
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    status?: number;
    message?: string;
    errors?: string[]; 
}