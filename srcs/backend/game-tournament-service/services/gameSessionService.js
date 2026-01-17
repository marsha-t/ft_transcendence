import { getUserInfo } from './profileServiceClient.js';

// Create a game with any number of players
/*
  - Creates a new game session with any number of players to start with
    - A normal game would mean creating a game session with 1 player (requester)
    - In tournaments, a game session is created with 2 players
    - In AI games, a game session is created with 2 players (requester + AI)
  - Checks that player(s) was provided
  - Get display name of player 
  - If it is a tournament game, check that players in the game are in the tournament 
  - Create game session linking it to players and tournament (if applicable)
*/
export async function createGameSession(prisma, { players, tournamentId, matchIndex, isAi = false }) {
  if (!players || players.length === 0) {
    const err = new Error('At least one player is required to create a session');
    err.statusCode = 400;
    err.code = 'NO_PLAYERS';
    throw err;
  }

  // Get display names 
  const playerData = [];
  for (const p of players) {
    let displayName;
    if (p.userId) {
      const userInfo = await getUserInfo(Number(p.userId));
      displayName = userInfo.username;
    } else {
      if (!p.guestName?.trim()) {
        const err = new Error('Guest must provide a guestName');
        err.statusCode = 400;
        err.code = 'GUEST_NAME_REQUIRED';
        throw err;
      }
      displayName = p.guestName;
    }

    // Check that players in game are in tournament
    let tournamentPlayerId = null;
    if (tournamentId) {
      const tp = await prisma.tournamentPlayer.findFirst({
        where: {
          tournamentId: Number(tournamentId),
          displayName: displayName,
        },
      });
      if (!tp) {
        const err = new Error(`Tournament player not found for ${displayName}`);
        err.statusCode = 404;
        err.code = 'TOURNAMENT_PLAYER_NOT_FOUND';
        throw err;
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
    await prisma.tournamentMatch.update({
      where: {
        tournamentId_matchIndex: {
          tournamentId: Number(tournamentId),
          matchIndex: Number(matchIndex),
        },
      },
      data: {
        gameSessionId: session.id,
      },
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

// Controller to decide which set of checks to run depending on status
/*
	- Not allowed to manually set FINISHED (must be via scoring)
	- For PLAYING: requires exactly 2 players, one LEFT and one RIGHT
	- For PAUSED: requires session to have started (startedAt not null)
*/
export function runChecks(session, nextStatus) {
	if (nextStatus === 'FINISHED') {
		const err = new Error('FINISHED status must be set via scoring, not manually');
		err.statusCode = 400;
    err.code = 'INVALID_MANUAL_FINISH';
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

// Checks for PLAYING status
/*
  - Check there are 2 players and both sides are taken
*/
function checkPlaying(session) {
  if (session.players.length !== 2) {
    const err = new Error('Exactly 2 players must join before PLAYING');
    err.statusCode = 400;
    err.code = 'INVALID_PLAYER_COUNT';
    throw err;
  }
  const sides = new Set(session.players.map(p => p.side));
  if (sides.size !== 2) {
    const err = new Error('Both LEFT and RIGHT sides must be taken before PLAYING');
    err.statusCode = 400;
    err.code = 'INVALID_PLAYER_SIDES';
    throw err;
  }
}

// Checks for PAUSED status
/*
  - Check that game has started
*/
function checkPaused(session) {
	if (!session.startedAt) {
		const err = new Error('Cannot pause a session that has not started');
		err.statusCode = 400;
    err.code = 'CANNOT_PAUSE_NOT_STARTED';
		throw err;
	}
}
