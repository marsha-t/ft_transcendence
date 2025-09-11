import { createGameSessionSchema, getAllGameSessionsSchema, getGameSessionByIdSchema, deleteGameSessionSchema, updateSessionStatusSchema } from '../schemas/gameSession.js';
import prisma from '../prisma/prismaClient.js';
import { isValidTransition, buildUpdateData, runChecks } from '../services/gameSessionService.js';

async function gameSessionRoutes(app, options) {    

  // Create game session with first player
  app.post('/api/game-sessions', {schema: createGameSessionSchema }, async (request, reply) => {
    const { userId, guestName, side } = request.body ?? {};

    try {
      let finalDisplayName; 

      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: Number(userId) },
          select: { username: true},
        });
        if (!user) {
          return reply.code(404).send({ error: 'User not found' });
        }
        finalDisplayName = user.username;
      } else {
        if (!guestName) {
          return reply.code(400).send({ error: 'Guest must provide a guestName' });
        }
        finalDisplayName = guestName;
      }

      const session = await prisma.gameSession.create({
        data: {
          players: {
            create: {
              userId: userId ? Number(userId) : null,
              isGuest: !userId,
              displayName: finalDisplayName,
              side,
            }
          }
        },
        include: { players: true },
      });

      return reply.code(201).send(session);
    }
    catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to create game session' });
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
      return reply.code(500).send({ error: 'Failed to fetch game sessions' });
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
      return reply.code(500).send({ error: 'Failed to fetch game session' });
    }
  });

  // Update game session status
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
      const updated = await prisma.gameSession.update({ where: { id: Number(sessionId) }, data});
      return reply.send(updated);
    } catch (err) {
      request.log.error(err);
      if (err.statusCode) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      return reply.code(500).send({ error: 'Failed to update session status' });
    }
  });
}

export default gameSessionRoutes;