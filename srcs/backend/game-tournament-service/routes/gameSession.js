import prisma from "../prisma/prismaClient.js";
import { createGameSessionSchema, updateSessionStatusSchema } from "../schemas/gameSession.js";
import { createGameSession, isValidTransition, buildUpdateData, runChecks} from "../services/gameSessionService.js";

async function gameSessionRoutes(app) {
  // Create game session 
  /*
    - Create game session entry with first player (requester) in it 
    - Side is set by frontend: it is possible for backend to support first player to play on either side
  */
  app.post('/game-sessions', { schema: createGameSessionSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.id;
    const { side } = request.body ?? {};

    const session = await createGameSession(prisma, {
      players: [{ userId, side }],
      tournamentId: null,
      matchIndex: null,
    });

    return reply.code(201).send(session);
    }
  );

  // Update game session status
  /*
    - Check session exists
    - Checks: request user is a player in game or tournament
    - Check that status transition is allowed (via isValidTransition())
    - Run additional checks specific to transition (via runChecks())
    - Update timestamps where appropriate (via buildUpdateData())
    - If aborting, check if it is part of tournament
      - If yes, abort tournament and other game sessions in tournament
    - Update GameSession
    - Log event together with current scores into gameEvent record
    - Return updated session object 
  */
  app.patch('/game-sessions/status', { schema: updateSessionStatusSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.id;
    const sessionId = Number(request.headers['x-current-session-id']);
    const { status: nextStatus } = request.body; 

    const session = await prisma.gameSession.findUnique({
      where: { id: Number(sessionId) },
      include: {
        players: true,
        tournamentMatch: { include: { tournament: true } },
      },
    });
    if (!session) {
      const err = new Error('Game session not found');
      err.statusCode = 404;
      err.code = 'SESSION_NOT_FOUND';
      throw err;
    }
    
    let isAuthorized = false;
    if (!session.tournamentMatch) {
      isAuthorized = session.players.some(p => p.userId === userId);
    } 
    else {
      const tournamentPlayers = await prisma.tournamentPlayer.findMany({
        where: { tournamentId: session.tournamentMatch.tournamentId },
        select: { userId: true },
      });
      isAuthorized = tournamentPlayers.some(p => p.userId === userId);
    }
    if (!isAuthorized) {
      const err = new Error('You are not authorized to modify this game session');
      err.statusCode = 403;
      err.code = 'NOT_AUTHORIZED';
      throw err;
    }

    if (!isValidTransition(session.status, nextStatus)) {
      const err = new Error(`Invalid transition: ${session.status} to ${nextStatus}`);
      err.statusCode = 400;
      err.code = 'INVALID_STATUS_TRANSITION';
      throw err;
    }

    runChecks(session, nextStatus);
    const data = buildUpdateData(session, nextStatus);
    
    // If game is part of tournament, abort tournament and other game sessions
    if (nextStatus === "ABORTED") {
      const now = new Date();

      if (session.tournamentMatch?.tournamentId) {
        const tournamentId = session.tournamentMatch.tournamentId;
        await prisma.tournament.update({
          where: { id: tournamentId },
          data: { status: "ABORTED", endedAt: now },
        });
        await prisma.gameSession.updateMany({
          where: {
            tournamentMatch: { tournamentId },
            id: { not: session.id },
          },
          data: { status: "ABORTED", endedAt: now },
        });
      }
    }

    const updated = await prisma.gameSession.update({
      where: { id: Number(sessionId) },
      data,
      include: { players: true },
    });

    // Update GameEvent table with event type and current score
    let type = null;
    switch (nextStatus) {
      case "PLAYING":
        type = session.status === "CREATED" ? "START" : "RESUME";
        break;
      case "PAUSED":
        type = "PAUSE";
        break;
      case "ABORTED":
        type = "FINISH";
        break;
      default:
        break;
    }

    if (type) {
      const players = await prisma.gameSessionPlayer.findMany({
        where: { sessionId: Number(sessionId) },
        select: { side: true, score: true },
      });

      const leftScore = players.find((p) => p.side === "LEFT")?.score ?? 0;
      const rightScore =
        players.find((p) => p.side === "RIGHT")?.score ?? 0;

      await prisma.gameEvent.create({
        data: {
          sessionId: Number(sessionId),
          type,
          scoreLeft: leftScore,
          scoreRight: rightScore,
        },
      });
    }

    return reply.send(updated);
  });
}

export default gameSessionRoutes;
