import prisma from '../prisma/prismaClient.js';
import { 
  startGameSchema, 
  updateScoreSchema, 
  finishGameSchema 
} from '../schemas/ai.js';

export default async function aiRoutes(fastify, options) {
  
  // Health check
  fastify.get('/ai/health', async (request, reply) => {
    return { status: 'ok', service: 'ai-service' };
  });

  // Start AI game - just create database record
  fastify.post('/ai/game/start', {
    preHandler: [fastify.authenticate],
    schema: startGameSchema
  }, async (request, reply) => {
    try {
      const userId = request.user.id;

      const gameSession = await prisma.aIGameSession.create({
        data: {
          userId,
          playerScore: 0,
          aiScore: 0
        }
      });

      return {
        success: true,
        gameId: gameSession.id
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create AI game session' });
    }
  });

  // Update game score
  fastify.patch('/ai/game/:gameId/score', {
    preHandler: [fastify.authenticate],
    schema: updateScoreSchema
  }, async (request, reply) => {
    try {
      const gameId = parseInt(request.params.gameId);
      const { playerScore, aiScore } = request.body;

      const updated = await prisma.aIGameSession.update({
        where: { id: gameId },
        data: {
          playerScore,
          aiScore
        }
      });

      return { success: true, game: updated };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update score' });
    }
  });

  // Finish game and save stats
  fastify.post('/ai/game/:gameId/finish', {
    preHandler: [fastify.authenticate],
    schema: finishGameSchema
  }, async (request, reply) => {
    try {
      const gameId = parseInt(request.params.gameId);
      const { winner, playerScore, aiScore } = request.body;
      const userId = request.user.id;

      // Update game session
      const gameSession = await prisma.aIGameSession.update({
        where: { id: gameId },
        data: {
          winner,
          playerScore,
          aiScore,
          finishedAt: new Date()
        }
      });

      const isWin = winner === 'player';

      // Get or create stats
      let stats = await prisma.aIGameStats.findUnique({
        where: { userId }
      });

      if (stats) {
        const newStreak = isWin ? stats.currentStreak + 1 : 0;
        const longestStreak = Math.max(stats.longestWinStreak, newStreak);

        stats = await prisma.aIGameStats.update({
          where: { userId },
          data: {
            totalAIGames: { increment: 1 },
            aiGamesWon: { increment: isWin ? 1 : 0 },
            aiGamesLost: { increment: isWin ? 0 : 1 },
            currentStreak: newStreak,
            longestWinStreak: longestStreak,
            lastPlayedAt: new Date()
          }
        });
      } else {
        stats = await prisma.aIGameStats.create({
          data: {
            userId,
            totalAIGames: 1,
            aiGamesWon: isWin ? 1 : 0,
            aiGamesLost: isWin ? 0 : 1,
            currentStreak: isWin ? 1 : 0,
            longestWinStreak: isWin ? 1 : 0,
            lastPlayedAt: new Date()
          }
        });
      }

      return { 
        success: true, 
        gameSession,
        stats
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to finish game' });
    }
  });

  // Get AI game history
  fastify.get('/ai/games/history', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;

      const games = await prisma.aIGameSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      return { success: true, games };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get game history' });
    }
  });

  // Get AI stats
  fastify.get('/ai/stats', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;

      let stats = await prisma.aIGameStats.findUnique({
        where: { userId }
      });

      if (!stats) {
        stats = await prisma.aIGameStats.create({
          data: { userId }
        });
      }

      return { success: true, stats };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get stats' });
    }
  });
}