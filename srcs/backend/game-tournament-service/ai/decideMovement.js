// Decide AI's move based on prediction
/*
	- If no intersection predicted, AI drifts back to center
	- If paddle is near arena boundary, stop pushing paddle to the end
	- If paddle is almost aligned with ball, prevent paddle from oscillating/jittering
*/
export default function decideMovement({ aiPaddleZ, zIntercept, arena, hasIntercept }) {
	
	const tolerance = 0.25;
	const paddleBoundaryBuffer = 0.3;
	
	// If the ball won't reach → drift to center
	if (!hasIntercept) {
		if (aiPaddleZ > tolerance) return "UP";
		if (aiPaddleZ < -tolerance) return "DOWN";
		return "NONE";
	}

	// When near arena boundary, stop pushing paddle before hitting the edge
	if (aiPaddleZ <= arena.zMin + paddleBoundaryBuffer) return "UP";
	if (aiPaddleZ >= arena.zMax - paddleBoundaryBuffer) return "DOWN";

	// Add tolerance to prevent paddle from jittering around target when paddle is 'almost' aligned
	if (aiPaddleZ < zIntercept - tolerance)  return "UP";
	if (aiPaddleZ > zIntercept + tolerance) return "DOWN";

	return "NONE";
};
