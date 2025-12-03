function decideMovement({ aiPaddleZ, zIntercept, arena }) {

	// Add tolerance to prevent paddle from jittering around target when paddle is 'almost' aligned
	const tolerance = 0.25;
	const paddleBoundaryBuffer = 0.3;

	if (aiPaddleZ <= arena.zMin + paddleBoundaryBuffer) return "DOWN";
	if (aiPaddleZ >= arena.zMax - paddleBoundaryBuffer) return "UP";

	if (aiPaddleZ < zIntercept - tolerance) {
		return "DOWN";
	}
	if (aiPaddleZ > zIntercept + tolerance) {
		return "UP";
	}
	return "NONE";
};

module.exports = decideMovement;