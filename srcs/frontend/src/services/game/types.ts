export type PlayerSide = "LEFT" | "RIGHT";

export type GameOptions = {
    sessionId?: string;
    isTournament?: boolean;
    displayNames?: { leftName: string; rightName: string };
    onMatchEnd?: () => void;
  };

export type GameStatus =
    | "CREATED"    // Initial state when session is created
    | "PLAYING"    // Game is active
    | "PAUSED"     // Game is temporarily paused
    | "FINISHED"   // Game completed normally
    | "ABORTED";   // Game was terminated early;

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
    winnerName?: string;
    createdAt?: string;
    startedAt?: string;
    endedAt?: string;
    tournamentMatch?: {
        id: number;
        tournamentId: number;
        matchIndex: number;
    } | null;
}


