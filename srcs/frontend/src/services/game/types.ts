export type PlayerSide = "LEFT" | "RIGHT";
export type GameStatus = | "PLAYING" | "PAUSED" | "FINISHED" | "ABORTED";

export interface Player{
    userId?: string;
    guestName?: string;
    side: PlayerSide;
    score: number;
    displayName: string;
}

export interface GameSession{
    sessionId: string;
    status: GameStatus;
    players: Player[];
    winner?: PlayerSide;
}