function predictBallIntercept(state) {
	
	const { ball, arena, aiPaddle, oppPaddle, constants } = state;
	let { x, z, vx, vz } = ball;
	let { zMin, zMax }  = arena;
	let { paddleDepth, ballRadius, maxBounceAngle, paddleInfluence, speedIncrement, maxSpeed } = constants;
	const halfDepth = paddleDepth / 2;

	const aiPaddleX = aiPaddle.x;
	const oppPaddleX = oppPaddle.x;

	// If ball is not moving horizontally - will never reach paddle
	// - Add eps in case ball speed is very small due to floating point drift
	// - Handles case where ball is reset to middle 
	const eps = 0.0001;

	if (Math.abs(vx) < eps) {
		return { zIntercept: z, time: Infinity, willReach: false };
	}

	const movingRight = vx > 0;
	// If ball moving right but AI is on left
	if (movingRight && aiPaddleX < x) return { willReach: false};
	// If ball moving left but AI is on right
	if (!movingRight && aiPaddleX > x) return { willReach: false};

	// Simulate ball movement for set time
	// - Stop simulation if intercept found
	// - Simulation caters for wall bounce
	// - Simulate at 120 frames per second and cap to 10 seconds (of game time) to avoid infinite loops 
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

		// At least one of them is crossed
		// - In unlikely case that both are crossed (rare given small dt), choose closer one

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
		// - Reverse horizontal speed
		// - Calculate vertical speed based on same formula as frontend
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

module.exports = predictBallIntercept;