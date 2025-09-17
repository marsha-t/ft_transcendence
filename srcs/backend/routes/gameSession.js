import { createGameSessionSchema, getAllGameSessionsSchema, getGameSessionByIdSchema, deleteGameSessionSchema, updateSessionStatusSchema } from '../schemas/gameSession.js';
import prisma from '../prisma/prismaClient.js';
import { isValidTransition, buildUpdateData, runChecks } from '../services/gameSessionService.js';

async function gameSessionRoutes(app, options) {    

  // Create new game session
  app.post('/api/game-sessions', {schema: createGameSessionSchema }, async (request, reply) => {
    const { maxScore } = request.body ?? {};
    try {
      const session = await prisma.gameSession.create({
        data: {
          maxScore: maxScore ?? 5,
        },
      });
      return reply.code(201).send(session); // Send back data that was created
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
        include: { players: true, winner: true },
      });
      return reply.send(sessions); // auto send 200; send back nested data with players and winners 
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch game sessions' });
    }
  });

  // Get single game session
  app.get('/api/game-sessions/:id', { schema: getGameSessionByIdSchema }, async (request, reply) => {
    const { id } = request.params;

    try {
      const session = await prisma.gameSession.findUnique({
        where: { id: Number(id) },
        include: { players: true, winner: true },
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

  // Delete game session
  app.delete('/api/game-sessions/:id', { schema: deleteGameSessionSchema }, async (request, reply) => {
    const { id } = request.params;

    try {
        const session = await prisma.gameSession.findUnique({
          where: { id: Number(id) },
        });

        if (!session) {
          return reply.code(404).send({ error: 'Game session not found' });
        }
      await prisma.gameSession.delete({
        where: { id: Number(id) },
      });
      return reply.code(200).send({ message: 'Game session deleted' });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to delete game session' });
    }
  });

  // Update game session status
  app.patch('/api/game-sessions/:id/status', {schema: updateSessionStatusSchema }, async (request, reply) => {
    const { id } = request.params;
    const { status: nextStatus, winnerUserId } = request.body; 
    
    try {
      const session = await prisma.gameSession.findUnique({
        where: { id: Number(id) },
        include: { players: true }
      });
      if (!session) {
        return reply.code(404).send({ error: 'Game session not found' });
      }
      if (!isValidTransition(session.status, nextStatus)) {
        return reply.code(400).send({ error: `Invalid transition: ${session.status} to ${nextStatus}` });
      }
      runChecks(session, nextStatus, winnerUserId);
      const data = buildUpdateData(session, nextStatus, winnerUserId);
      const updated = await prisma.gameSession.update({ where: { id: Number(id) }, data});
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