
export interface GameDashboard {
	summary: GameSummary;
	timeline: GameTimelinePoint[];
	players: PlayerStats[];
}
export interface GameSummary {
	sessionId: number;
	status: "CREATED" | "PLAYING" | "PAUSED" | "FINISHED" | "ABORTED";
	startedAt: string;
	endedAt: string;
	totalDurationSec: number;
	activeDurationSec: number;
	finalScore: {
		left: number;
		right: number;
	};
	winner: {
		displayName: string;
		avatar: string;
		side: "LEFT" | "RIGHT";
	} | null;
}

export interface GameTimelinePoint {
	elapsedSec: number;
	scoreLeft: number;
	scoreRight: number;
	scorerSide: "LEFT" | "RIGHT" | null;
}

export interface PlayerStats {
	displayName: string;
	side: "LEFT" | "RIGHT";
	avatar: string;
	score: number;
	timeToFirstPointSec: number | null;
	avgTimePerPointSec: number | null;
	totalMatches: number;
	totalWins: number;
	winRate: number;
}
