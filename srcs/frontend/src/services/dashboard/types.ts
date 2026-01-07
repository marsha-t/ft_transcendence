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

export interface UserDashboard {
	overview: UserOverview;
	dailyStats: DailyStat[];
	scoreDistribution: number[];
	winsPerOpponent: OpponentStat[];
	leaderboard: LeaderboardEntry[];
}

export interface UserOverview {
	totalMatches: number;
	totalWins: number;	
	winRate: number;	
	avgScore: number;	
	currentWinStreak: number;	
	longestWinStreak: number;	
	lastPlayedAt: string | null;
}

export interface DailyStat {
	date: string; 
	winRate: number;
}

export interface OpponentStat {
	opponent: string;
	winRate: number;
	total: number;
}

export interface LeaderboardEntry {
	rank: number;
	username: string;
	totalMatches: number;
	winRate: number;
	avgScore: number;
	leaderboardScore: number;
	isCurrentUser: boolean;
}

export interface MatchHistory {
    date: string;       
    opponent: string;
    opponentAvatar: string;
    userScore: number;
    opponentScore: number;
    result: "WIN" | "LOSS";
    isTournament: boolean;
  }
  