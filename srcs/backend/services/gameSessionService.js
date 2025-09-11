export function isValidTransition(fromStatus, toStatus) {
	const allowedTransitions = {
		CREATED: new Set(['PLAYING', 'ABORTED']),
    	PLAYING: new Set(['PAUSED', 'ABORTED']),
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

export function buildUpdateData(session, nextStatus) {
	let data = { status: nextStatus };
	if (nextStatus === 'PLAYING' && !session.startedAt) {
		data.startedAt = new Date();
	}
	if (nextStatus === 'ABORTED') {
		data.endedAt = new Date();
	}
	return data;
}

export function runChecks(session, nextStatus) {
	if (nextStatus === 'FINISHED') {
		const err = new Error('FINISHED status must be set via scoring, not manually');
		err.statusCode = 400;
		throw err;
	}

	switch (nextStatus) {
		case 'PLAYING':
			checkPlaying(session);
			break;
		case 'PAUSED':
			checkPaused(session);
			break;
		default:
			break;
	}
}

function checkPlaying(session) {
  if (session.players.length !== 2) {
    const err = new Error('Exactly 2 players must join before PLAYING');
    err.statusCode = 400;
    throw err;
  }
  const sides = new Set(session.players.map(p => p.side));
  if (sides.size !== 2) {
    const err = new Error('Both LEFT and RIGHT sides must be taken before PLAYING');
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
