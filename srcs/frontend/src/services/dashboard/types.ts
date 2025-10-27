export interface GameTimelinePoint {
	elapsedSec: number;
	scoreLeft: number;
	scoreRight: number;
	scorerSide: "LEFT" | "RIGHT" | null;
}

export interface GameDashboard {
	timeline: GameTimelinePoint[];
}
