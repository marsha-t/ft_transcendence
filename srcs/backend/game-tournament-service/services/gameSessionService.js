// Create a game with any number of players
/*
  - Creates a new game session with any number of players to start with
    - Starting a normal game would mean creating a game session with 1 player
    - In tournaments, a game session can be created with 1 player or with 2
  - Checks that player(s) was provided
  - Checks that user/guestName was provided (and user exists)
  - If it is a tournament, check that player is in the tournament
  - Create game session linking it to players and tournament (if applicable)
*/
export async function createGameSession(prisma, { players, tournamentId, matchIndex, isAi = false }) {
  if (!players || players.length === 0) {
    throw { code: 400, message: 'At least one player is required to create a session' };
  }

  const playerData = [];
  for (const p of players) {
    let displayName;
    if (p.userId) {
      // ✅ FIX: Replace prisma.user.findUnique() with API call
      try {
        const userInfo = await getUserInfo(Number(p.userId));
        displayName = userInfo.username;
      } catch (err) {
        console.error(`Failed to fetch user info for userId ${p.userId}:`, err);
        throw { 
          code: 404, 
          message: `User not found for id ${p.userId}` 
        };
      }
    } else {
      if (!p.guestName?.trim()) {
        throw { code: 400, message: 'Guest must provide a guestName' };
      }
      displayName = p.guestName;
    }

    let tournamentPlayerId = null;
    console.log("tournamentId in service:", tournamentId, typeof tournamentId);

    if (tournamentId) {
      const tp = await prisma.tournamentPlayer.findFirst({
        where: {
          tournamentId: Number(tournamentId),
          displayName: displayName,
        },
      });
      if (!tp) {
        throw { code: 404, message: `Tournament player not found for ${displayName}` };
      }
      tournamentPlayerId = tp.id;
    }
    playerData.push({
      userId: p.userId ? Number(p.userId) : null,
      isGuest: !p.userId,
      displayName,
      side: p.side,
      tournamentPlayerId,
    });
  }

  const session = await prisma.gameSession.create({
    data: {
      isAi: isAi,
      players: {
        create: playerData,
      },
    },
    include: { players: true },
  });

  if (tournamentId && matchIndex) {
    await prisma.tournamentMatch.updateMany({
      where: { tournamentId: Number(tournamentId), matchIndex: Number(matchIndex) },
      data: { gameSessionId: session.id },
    });
  }
  return session;
}

/*
	- Validates whether a status transition is allowed
  - Only these transitions are allowed:
		- CREATED → PLAYING | ABORTED
		- PLAYING → PAUSED | ABORTED
		- PAUSED  → PLAYING | ABORTED
		- FINISHED, ABORTED → no further transitions
	Returns true if transition is valid, false otherwise
*/
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

/*
	Builds update data for Prisma based on next status:
		- Sets 'status' to nextStatus
		- Adds 'startedAt' timestamp if transitioning to PLAYING (and not already set)
		- Adds 'endedAt' timestamp if transitioning to ABORTED
*/
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

/*
	- Not allowed to manually set FINISHED (must be via scoring)
	- For PLAYING: requires exactly 2 players, one LEFT and one RIGHT
	- For PAUSED: requires session to have started (startedAt not null)
*/
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
