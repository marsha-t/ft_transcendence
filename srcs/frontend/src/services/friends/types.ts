

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

export interface UserSearchResult {
    id: number;
    username: string;
    avatar: string;
    friendStatus: 'not_friend' | 'pending_sent';
}
