import prisma from '../prisma/prismaClient.js';
import { joinSessionSchema, updateScoreSchema } from '../schemas/gameSessionPlayers.js';
import { checkSessionRequester } from '../services/gameSessionPlayersService.js';
import { propagateWinner } from "../services/tournamentService.js";
import { updateUserStats } from '../services/authServiceClient.js';

async function gameSessionPlayersRoutes(app, options) {
  // Add guest to game session
  /*
		- Checks session exists and is of 'CREATED' status
		- Checks that side is not already taken and session isn't already full
		- Check that request user is in the game
		- Check that player in session doesn't already use the same displayname
		- Add player to GameSessionPlayer table
	*/
  app.post("/game-sessions/players", { schema: joinSessionSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.id;
    const sessionId = Number(request.headers['x-current-session-id']);
    const { guestName, side } = request.body ?? {};

    const session = await prisma.gameSession.findUnique({
      where: { id: Number(sessionId) },
      include: { players: true },
    });
    if (!session) {
      const err = new Error("Game session not found");
      err.statusCode = 404;
      err.code = "GAME_SESSION_NOT_FOUND";
      throw err;
    }
    if (session.status !== 'CREATED') {
      const err = new Error("Session cannot accept new players");
      err.statusCode = 400;
      err.code = "SESSION_NOT_JOINABLE";
      throw err;
    }
    if (session.players.some(p => p.side === side)) {
      const err = new Error("Side already taken");
      err.statusCode = 409;
      err.code = "SIDE_TAKEN";
      throw err;
    }
    if (session.players.length >= 2) {
      const err = new Error("Session already full");
      err.statusCode = 409;
      err.code = "SESSION_FULL";
      throw err;
    }

    const isUserPlayer = session.players.some(p => p.userId === userId);
    if (!isUserPlayer) {
      const err = new Error("You are not a player in this game session");
      err.statusCode = 403;
      err.code = "NOT_A_SESSION_PLAYER";
      throw err;
    }
    
    let displayName = guestName.trim();
    if (session.players.some(p => p.displayName === displayName)) {
      const err = new Error("Display name is already taken in this session");
      err.statusCode = 409;
      err.code = "DISPLAY_NAME_TAKEN";
      throw err;
    }

    const newPlayer = await prisma.gameSessionPlayer.create({
      data: {
        sessionId: Number(sessionId),
        userId: null,
        isGuest: true,
        displayName,
        side,
      },
      include: { 
        session: true,
        winnerOfGame: true,
        tournamentPlayer: true,
        events: true,
        },
    });
    return reply.code(201).send(newPlayer);
  });

  // Update player score
  /* 
		- Checks session exists and requester is in game t
    - Check that game status is 'PLAYING'
		- Updates player's score
    - Fetch refreshed scores for logging GameEvent
		- If score reaches win condition (score = 5)
			- Mark session as FINISHED and records winner in GameSession table (PlayerId = GameSessionPlayer.id)
      - Update GameEvent as well (playerId = GameSessionPlayer.id)
			- Update stats in User table 
				- If session is from a tournament, 
					- update winner in TournamentMatch table (PlayerId = TournamentPlayer.id)
					- propagateWinner() propagates winner and also marks tournament as FINISHED if last match
		- returns updated session 
	*/
  app.patch("/game-sessions/players/score", { schema: updateScoreSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.id;
    const sessionId = Number(request.headers['x-current-session-id']);
    const side = request.headers["x-player-side"];

    const session = await checkSessionRequester(prisma, userId, sessionId);
    if (session.status !== "PLAYING") {
      const err = new Error(`Cannot update score when game status is '${session.status}'`);
      err.statusCode = 400;
      err.code = 'INVALID_GAME_STATE';
      throw err;
    }

    // Update score
    const player = await prisma.gameSessionPlayer.update({
      where: { sessionId_side: { sessionId: Number(sessionId), side } },
      data: { score: { increment: 1 } },
      include: { tournamentPlayer: { select: { id: true } } },
    });

    // Log GameEvent
    const players = await prisma.gameSessionPlayer.findMany({
      where: { sessionId: Number(sessionId) },
      select: { id: true, side: true, score: true },
    });
    const leftScore = players.find((p) => p.side === "LEFT")?.score ?? 0;
    const rightScore = players.find((p) => p.side === "RIGHT")?.score ?? 0;
    await prisma.gameEvent.create({
      data: {
        sessionId: Number(sessionId),
        playerId: player.id,
        type: "POINT",
        scoreLeft: leftScore,
        scoreRight: rightScore,
      },
    });

    // If game reaches winning score 
    let finishedGame = null;

    if (player.score >= 5) {
      finishedGame = await prisma.gameSession.update({
        where: { id: session.id },
        data: {
          status: "FINISHED",
          endedAt: new Date(),
          winnerUserId: player.userId ?? null,
          winnerPlayerId: player.id,
        },
        include: { players: true },
      });

      await prisma.gameEvent.create({
        data: {
          sessionId: session.id,
          playerId: player.id,
          type: "FINISH",
          scoreLeft: leftScore,
          scoreRight: rightScore,
        },
      });
    }

    // Update user stats
    if (finishedGame) {
      const winnerUserId = player.userId;
      const losingPlayer = finishedGame.players.find(p => p.userId !== winnerUserId);
      
      if (winnerUserId) {
        await updateUserStats(winnerUserId, {
        won: true,
        score: player.score,
        opponentScore: losingPlayer?.score || 0
        });
      }
      
      if (losingPlayer?.userId) {
        await updateUserStats(losingPlayer.userId, {
        won: false,
        score: losingPlayer.score,
        opponentScore: player.score
        });
      }

      // Tournament progression
      const match = await prisma.tournamentMatch.findFirst({
        where: { gameSessionId: finishedGame.id },
        include: { tournament: true },
      });

      if (match) {
        await prisma.tournamentMatch.update({
          where: { id: match.id },
          data: {
            winnerUserId: player.userId ?? null,
            winnerPlayerId: player.tournamentPlayerId ?? null,
          },
        });

        await propagateWinner(prisma, {
          tournamentId: match.tournamentId,
          bracketSize: match.tournament.bracketSize,
          fromMatchIndex: match.matchIndex,
          winnerPlayerId: player.tournamentPlayerId ?? null,
        });
      }
    }

    // Return updated session
    const updatedSession = await prisma.gameSession.findUnique({
      where: { id: Number(sessionId) },
      include: { players: true },
    });
    if (!updatedSession) {
      const err = new Error('Game session not found');
      err.statusCode = 404;
      err.code = 'SESSION_NOT_FOUND';
      throw err;
    }

    return reply.send({
      sessionId: String(updatedSession.id),
      status: updatedSession.status,
      createdAt: updatedSession.createdAt,
      startedAt: updatedSession.startedAt,
      endedAt: updatedSession.endedAt,
      players: updatedSession.players.map((p) => ({
        userId: p.userId ? String(p.userId) : undefined,
        guestName: p.isGuest ? p.displayName : undefined,
        displayName: p.displayName,
        side: p.side,
        score: p.score,
      })),
      winner:
        updatedSession.winnerPlayerId &&
        updatedSession.players.find(
          (p) => p.id === updatedSession.winnerPlayerId
        )?.side,
      winnerName:
        updatedSession.winnerPlayerId &&
        updatedSession.players.find(
          (p) => p.id === updatedSession.winnerPlayerId
        )?.displayName,
    });
  });
}

export default gameSessionPlayersRoutes;
