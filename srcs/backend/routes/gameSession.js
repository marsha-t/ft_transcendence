import { createGameSessionSchema, getAllGameSessionsSchema, getGameSessionByIdSchema, updateSessionStatusSchema } from '../schemas/gameSession.js';
import prisma from '../prisma/prismaClient.js';
import { createGameSession, isValidTransition, buildUpdateData, runChecks } from '../services/gameSessionService.js';

async function gameSessionRoutes(app, options) {    

  // Create game session with first player
  app.post('/api/game-sessions', {schema: createGameSessionSchema }, async (request, reply) => {
    const { userId, guestName, side } = request.body ?? {};
    request.log.info({ body: request.body }, 'Incoming createGameSession request');

    try {
      const session = await createGameSession(prisma, {
        players: [{ userId, guestName, side }], tournamentId: null, matchIndex: null
      });

      return reply.code(201).send(session);
    }
    catch (err) {
      request.log.error(err);
      return reply.code(err.code || 500).send({ error: err.message || "Failed to create game session" });

    }
  });

  // Get all game sessions 
  app.get('/api/game-sessions', { schema: getAllGameSessionsSchema }, async (request, reply) => {
    try {
      const sessions = await prisma.gameSession.findMany({
        include: { players: true, winnerUser: true, winnerPlayer: true },
      });
      return reply.send(sessions);
    } catch (err) {
      request.log.error(err);
      return reply.code(err.code || 500).send({ error: err.message || "Failed to fetch game sessions" });
    }
  });

  // Get single game session
  app.get('/api/game-sessions/:sessionId', { schema: getGameSessionByIdSchema }, async (request, reply) => {
    const { sessionId } = request.params;

    try {
      const session = await prisma.gameSession.findUnique({
        where: { id: Number(sessionId) },
        include: { players: true, winnerUser: true, winnerPlayer: true },
      });

      if (!session) {
        return reply.code(404).send({ error: 'Game session not found' });
      }
      return reply.send(session);
    } catch (err) {
      request.log.error(err);
      return reply.code(err.code || 500).send({ error: err.message || "Failed to fetch game session" });
    }
  });

  // Update game session status
  /*
    - Check session exists
    - Check that status transition is allowed (via isValidTransition())
    - Run additional checks specific to transition (via runChecks())
    - Update timestamps where appropriate
    - Update GameSession
    - Return updated session object 
  */
  app.patch('/api/game-sessions/:sessionId/status', {schema: updateSessionStatusSchema }, async (request, reply) => {
    const { sessionId } = request.params;
    const { status: nextStatus } = request.body; 
    try {
      const session = await prisma.gameSession.findUnique({
        where: { id: Number(sessionId) },
        include: { players: true }
      });
      if (!session) {
        return reply.code(404).send({ error: 'Game session not found' });
      }
      if (!isValidTransition(session.status, nextStatus)) {
        return reply.code(400).send({ error: `Invalid transition: ${session.status} to ${nextStatus}` });
      }
      runChecks(session, nextStatus);
      const data = buildUpdateData(session, nextStatus);
      const updated = await prisma.gameSession.update({ where: { id: Number(sessionId) }, data, include: { players: true }});
      return reply.send(updated);
    } catch (err) {
      request.log.error(err);
      if (err.statusCode) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      return reply.code(err.code || 500).send({ error: err.message || "Failed to update game session status" });

    }
  });
}

export default gameSessionRoutes;