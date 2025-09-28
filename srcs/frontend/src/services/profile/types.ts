export interface ProfileData {
    username: string;
    avatar: string;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    status?: number;
    message?: string;
    errors?: string[]; 
}