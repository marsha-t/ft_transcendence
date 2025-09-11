export function isValidTransition(fromStatus, toStatus) {
	const allowedTransitions = {
		CREATED: new Set(['READY', 'ABORTED']),
    	READY: new Set(['PLAYING', 'ABORTED']),
    	PLAYING: new Set(['PAUSED', 'FINISHED', 'ABORTED']),
    	PAUSED: new Set(['PLAYING', 'ABORTED']),
    	FINISHED: new Set([]),
    	ABORTED: new Set([])
	};
	const allowedNextStates = allowedTransitions[fromStatus];

	if (!allowedNextStates) {
		return false;
	}

  	return allowedNextStates.has(toStatus);
}

export function buildUpdateData(session, nextStatus, winnerUserId) {
	let data = { status: nextStatus };
	if (nextStatus === 'PLAYING' && !session.startedAt) {
		data.startedAt = new Date();
	}
	if (nextStatus === 'FINISHED') {
		data.endedAt = new Date();
		data.winnerUserId = winnerUserId;
	}
	if (nextStatus === 'ABORTED') {
		data.endedAt = new Date();
	}
	return data;
}

export function runChecks(session, nextStatus, winnerUserId) {
	if (winnerUserId && nextStatus !== 'FINISHED') {
		const err = new Error('Winner can only be assigned when status is FINISHED');
		err.statusCode = 400;
		throw err;
	}

	switch (nextStatus) {
		case 'READY':
			checkReady(session);
			break;
		case 'PLAYING':
			checkPlaying(session);
			break;
		case 'PAUSED':
			checkPaused(session);
			break;
		case 'FINISHED':
			checkFinished(session, winnerUserId);
			break;
		default:
			break;
	}
}

function checkReady(session) {
	if (session.players.length !== 2) {
		const err = new Error('Exactly 2 players must join before READY');
		err.statusCode = 400;
		throw err;
	}
	const sides = new Set(session.players.map(p => p.side));
	if (sides.size !== 2) {
		const err = new Error('Duplicate side not allowed');
		err.statusCode = 400;
		throw err;
	}
}

function checkPlaying(session) {
	if (session.players.length !== 2 || session.players.some(p => !p.isReady)) {
		const err = new Error('Exactly 2 players must be READY before PLAYING');
		err.statusCode = 400;
		throw err;
	}
}

function checkPaused(session) {
	if (!session.startedAt) {
		const err = new Error('Cannot pause a session that has not started');
		err.statusCode = 400;
		throw err;
	}
}

function checkFinished(session, winnerUserId) {
	if (!winnerUserId) {
		const err = new Error('Winner is required to finish a session');
		err.statusCode = 400;
		throw err;
	}
	const winner = session.players.find(p => p.userId === winnerUserId);
	if (!winner) {
		const err = new Error('Winner must be a player in this session');
		err.statusCode = 400;
		throw err;
	}
	if (winner.score !== session.maxScore) {
		const err = new Error('Winner has not reached maxScore');
		err.statusCode = 400;
		throw err;
	}
}