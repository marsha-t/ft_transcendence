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

export interface AvatarUploadResponse {
    message: string;
    avatar: string;
}

export interface AvatarDeleteResponse {
    message: string;
    avatar: string;
}
