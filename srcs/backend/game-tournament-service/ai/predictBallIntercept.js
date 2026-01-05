// Predict ball intercept with AI paddle
/*
	- Early exit 
		- If ball is not moving horizontally (e.g., ball is reset to middle)
		- If ball is moving away from AI paddle
	- Simulate ball movement for next 10 seconds at 120 frames per second. Stop early if intercept found
		- Predict next position
		- Check whether next position will cross AI & human opp paddle line
		- If no intercept, apply wall bounce and continue simulation
		- If both paddles are crossed (unlikely), choose closer event to focus on
		- If intersection is AI, return intersection
		- If intersection is human, check if opponent will hit ball
			- If not, end prediction 
			- If yes, calculate reverse horizontal speed and vertical speed based on same formulas as frontend
*/
export default function predictBallIntercept(state) {
	const { ball, arena, aiPaddle, oppPaddle, constants } = state;
	let { x, z, vx, vz } = ball;
	let { zMin, zMax }  = arena;
	let { paddleDepth, ballRadius, maxBounceAngle, paddleInfluence, speedIncrement, maxSpeed } = constants;
	const halfDepth = paddleDepth / 2;

	const aiPaddleX = aiPaddle.x;
	const oppPaddleX = oppPaddle.x;

	// If ball is not moving horizontally - will never reach paddle
	const eps = 0.0001;
	if (Math.abs(vx) < eps) {
		return { zIntercept: z, time: Infinity, willReach: false };
	}

	// If ball is moving away from AI paddle
	const movingRight = vx > 0;
	if (movingRight && aiPaddleX < x) return { willReach: false}; // If ball moving right but AI is on left
	if (!movingRight && aiPaddleX > x) return { willReach: false}; // If ball moving left but AI is on right

	// Simulate ball movement for set time 
	const dt = 1/120;
	const maxTime = 10; 
	const maxSteps = Math.floor(maxTime / dt);
	let t = 0;

	for (let i = 0; i < maxSteps; i++) {
		const nextX = x + vx * dt;
		const nextZ = z + vz * dt;

		const crossesAIRight = vx > 0 && x <= aiPaddleX && nextX >= aiPaddleX;
		const crossesAILeft = vx < 0 && x >= aiPaddleX && nextX <= aiPaddleX;
		const crossesAI = (crossesAIRight || crossesAILeft);

		const crossesOppRight = vx > 0 && x <= oppPaddleX && nextX >= oppPaddleX;
		const crossesOppLeft = vx < 0 && x >= oppPaddleX && nextX <= oppPaddleX;
		const crossesOpp = (crossesOppRight || crossesOppLeft);

		// If no intercept - continue simulation
		if (!crossesAI && !crossesOpp) {
			x = nextX;
			z = nextZ;
			t += dt;
	
			// Apply wall bounce
			if (z <= zMin) {
				z = zMin + (zMin - z);
				vz = -vz;
			} else if (z >= zMax) {
				z = zMax - (z - zMax);
				vz = -vz;
			}
			continue;
		}

		// In unlikely case that both are crossed (rare given small dt), choose closer one
		let firstEvent = null;
		if (crossesAI) {
			const ratioAI = (aiPaddleX - x) / (nextX - x); // Distance from current ball to paddle / distance traveled in this frame
			const zAtAI = z + vz * dt * ratioAI; // Height where ball intersects paddle
			firstEvent = {
				type: 'AI',
				ratio: ratioAI,
				xAt: aiPaddleX,
				zAt: zAtAI,
			};
		}
		if (crossesOpp) {
			const ratioOpp = (oppPaddleX - x) / (nextX - x);
			const zAtOpp = z + vz * dt * ratioOpp;
			if (!firstEvent || ratioOpp < firstEvent.ratio) {
				firstEvent = {
					type: 'OPPONENT',
					ratio: ratioOpp, 
					xAt: oppPaddleX,
					zAt: zAtOpp,
				};
			}
		}

		const ratio = firstEvent.ratio;
		const eventTime = t + dt * ratio; // Time when ball intersects paddle 
		const eventX = firstEvent.xAt;
		const eventZ = firstEvent.zAt;

		if (firstEvent.type === 'AI') {
			return { zIntercept: eventZ, time: eventTime, willReach: true };
		}

		// If event is opponent, predict whether it will hit paddle and behaviour after
		const distanceZ = Math.abs(eventZ - oppPaddle.z);
		const collisionRange = halfDepth + ballRadius;

		// If opp paddle misses ball, ball won't reach AI paddle
		if (distanceZ > collisionRange) {
			return { zIntercept: eventZ, time: eventTime, willReach: false};
		}

		// If opp hits ball, predict return trajectory from collision point
		x = eventX;
		z = eventZ;
		t = eventTime;

		const originalVxMagnitude = Math.abs(vx);
		vx = -vx;

		const hitFactor = (z - oppPaddle.z) / halfDepth; 
		vz = hitFactor * maxBounceAngle * originalVxMagnitude + oppPaddle.vz * paddleInfluence;

		vx *= speedIncrement;
		vz *= speedIncrement;

		const newSpeedMag = Math.sqrt(vx * vx + vz * vz);
		if (newSpeedMag > maxSpeed) {
			const scale = maxSpeed / newSpeedMag;
			vx *= scale;
			vz *= scale;
		}
	}

	return { zIntercept: z, time: t, willReach: false};
}
