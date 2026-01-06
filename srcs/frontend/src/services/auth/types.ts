export interface RegisterData {
    username: string;
    email: string;
    password: string;
}

export interface LoginData {
    username: string;
    password: string;
}

export interface Login2FAData {
    username: string;
    code: string;
}

export interface ApiResponse<T> {
    success: boolean;
    status?: number;      // HTTP status code
    message: string;     // friendly message
    errors?: string[];    // validation errors
    code?: string;
    data?: T;             // any data returned
}

export interface LoginApiResponse<T> extends ApiResponse<T> {
    twoFactorRequired?: boolean;
}