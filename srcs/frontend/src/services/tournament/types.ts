import { LoginData } from "../auth/types.js";

type GuestPlayer = {
	guestName: string;
}

export type PlayerJoin = LoginData | GuestPlayer;

export type TournamentStatus = "CREATED" | "STARTED" | "FINISHED" | "ABORTED";

export interface Tournament {
	id: number;
	status: TournamentStatus;
	createdAt?: string;
	startedAt?: string;
	endedAt?: string;
}

export interface Player {
	id: number;
	displayName: string;
}

export interface NextMatch {
	matchIndex: number;
	player1: Player | null;
	player2: Player | null;
	gameSessionId: number | null;
	gameStatus: 'CREATED' | 'PLAYING' | 'PAUSED' | 'FINISHED' | 'ABORTED' | null;
}

export interface BracketMatch {
	matchIndex: number;
	player1: string | null;
	player2: string | null;
	winner: string | null;
}

export interface TournamentResults {
	champion: string | null;
	bracket: BracketMatch[];
	stats: {
		totalMatches: number;
		playedMatches: number;
	}
}

export interface GetNextMatchResponse {
	tournamentId: number;
	status: "FINISHED" | null;
	nextMatch: NextMatch | null;
	results: TournamentResults | null;
}