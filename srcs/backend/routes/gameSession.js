import {
  createGameSessionSchema,
  getGameSessionByIdSchema,
  updateSessionStatusSchema,
} from "../schemas/gameSession.js";
import prisma from "../prisma/prismaClient.js";
import {
  createGameSession,
  isValidTransition,
  buildUpdateData,
  runChecks,
} from "../services/gameSessionService.js";

async function gameSessionRoutes(app, options) {
  // Create game session with first player
  app.post('/api/game-sessions', {schema: createGameSessionSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.id;
    const { guestName, side } = request.body ?? {};

      if (!userId && !guestName) {
        return reply
          .code(400)
          .send({ error: "Either X-Current-User-Id or guestName is required" });
      }
      try {
        const session = await createGameSession(prisma, {
          players: [{ userId, guestName, side }],
          tournamentId: null,
          matchIndex: null,
        });

        return reply.code(201).send(session);
      } catch (err) {
        request.log.error(err);
        return reply
          .code(err.code || 500)
          .send({ error: err.message || "Failed to create game session" });
      }
    }
  );

  // Get single game session
  app.get('/api/game-sessions', { schema: getGameSessionByIdSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    const sessionIdHeader = request.headers['x-current-session-id'];
    const sessionId = sessionIdHeader ? Number(sessionIdHeader) : null;

      try {
        const session = await prisma.gameSession.findUnique({
          where: { id: Number(sessionId) },
          include: { players: true, winnerUser: true, winnerPlayer: true },
        });

        if (!session) {
          return reply.code(404).send({ error: "Game session not found" });
        }
        return reply.send(session);
      } catch (err) {
        request.log.error(err);
        return reply
          .code(err.code || 500)
          .send({ error: err.message || "Failed to fetch game session" });
      }
    }
  );

  // Update game session status
  /*
    - Check session exists
    - Check that status transition is allowed (via isValidTransition())
    - Run additional checks specific to transition (via runChecks())
    - Update timestamps where appropriate
    - If aborting, check if it is part of tournament
      - If yes, abort tournament and other game sessions in tournament
    - Update GameSession
    - Return updated session object 
  */
  
  app.patch('/api/game-sessions/status', {schema: updateSessionStatusSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    const sessionIdHeader = request.headers['x-current-session-id'];
    const sessionId = sessionIdHeader ? Number(sessionIdHeader) : null;
    const { status: nextStatus } = request.body; 

      try {
        const session = await prisma.gameSession.findUnique({
          where: { id: Number(sessionId) },
          include: {
            players: true,
            tournamentMatch: { include: { tournament: true } },
          },
        });
        if (!session) {
          return reply.code(404).send({ error: "Game session not found" });
        }
        if (!isValidTransition(session.status, nextStatus)) {
          return reply
            .code(400)
            .send({
              error: `Invalid transition: ${session.status} to ${nextStatus}`,
            });
        }
        runChecks(session, nextStatus);
        const data = buildUpdateData(session, nextStatus);
        if (nextStatus === "ABORTED") {
          const now = new Date();

          // If game is part of tournament, abort tournament and other game sessions
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

        let type = null;
        switch (nextStatus) {
          case "PLAYING":
            // This can represent both "started" and "resumed"
            type = session.status === "CREATED" ? "START" : "RESUME";
            break;
          case "PAUSED":
            type = "PAUSE";
            break;
          case "ABORTED":
            type = "ABORTED";
            break;
          default:
            break;
        }

        if (type) {
          // Fetch scores to log them
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
      } catch (err) {
        request.log.error(err);
        if (err.statusCode) {
          return reply.code(err.statusCode).send({ error: err.message });
        }
        return reply
          .code(err.code || 500)
          .send({
            error: err.message || "Failed to update game session status",
          });
      }
    }
  );
}

export default gameSessionRoutes;
