export interface RegisterData {
    username: string;
    email: string;
    password: string;
}

export interface LoginData {
    username: string;
    password: string;
}

export interface ApiResponse<T> {
    success: boolean;
    status?: number;      // HTTP status code
    message?: string;     // friendly message
    errors?: string[];    // validation errors
    data?: T;             // any data returned
}
