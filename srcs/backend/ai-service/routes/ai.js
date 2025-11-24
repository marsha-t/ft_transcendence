// routes/ai.js

import prisma from '../prisma/prismaClient.js';
import { 
  startGameSchema, 
  getMoveSchema, 
  updateScoreSchema, 
  finishGameSchema 
} from '../schemas/ai.js';

// AI Brain Class
class PongAI {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty;
    this.lastUpdate = Date.now();
    this.predictedZ = null; // Z is the axis paddles move on (not Y in your 3D game)
    this.updateInterval = 1000; // 1 second as per requirements
    
    // Difficulty settings
    this.config = this.getDifficultyConfig(difficulty);
  }

  getDifficultyConfig(difficulty) {
    const configs = {
      easy: {
        errorMargin: 1.5,      // Large error in prediction
        reactionDelay: 300,     // Slow to react
        deadzone: 0.8,          // Large deadzone (won't move unless far)
        predictionAccuracy: 0.6 // Only 60% accurate predictions
      },
      medium: {
        errorMargin: 0.8,
        reactionDelay: 150,
        deadzone: 0.4,
        predictionAccuracy: 0.8
      },
      hard: {
        errorMargin: 0.3,
        reactionDelay: 50,
        deadzone: 0.2,
        predictionAccuracy: 0.95
      }
    };
    return configs[difficulty] || configs.medium;
  }

  // Main prediction function - predicts where ball will be when it reaches paddle
  predictBallPosition(ballX, ballZ, ballVelX, ballVelZ, paddleX, tableZMin, tableZMax) {
    // If ball not moving toward paddle, stay centered
    if (ballVelX === 0) return 0;

    // Calculate time for ball to reach paddle
    const timeToReach = (paddleX - ballX) / ballVelX;
    
    // Ball moving away from AI paddle
    if (timeToReach < 0) {
      return ballZ; // Stay near current ball position
    }

    // Predict Z position
    let predictedZ = ballZ + (ballVelZ * timeToReach);
    
    // Simulate bounces off table walls (zMin and zMax)
    // Keep bouncing until position is valid
    while (predictedZ < tableZMin || predictedZ > tableZMax) {
      if (predictedZ < tableZMin) {
        predictedZ = tableZMin + (tableZMin - predictedZ);
      } else if (predictedZ > tableZMax) {
        predictedZ = tableZMax - (predictedZ - tableZMax);
      }
    }

    // Add error based on difficulty
    const error = (Math.random() - 0.5) * 2 * this.config.errorMargin;
    predictedZ += error;

    // Apply prediction accuracy (sometimes just stay where you are on easy mode)
    if (Math.random() > this.config.predictionAccuracy) {
      // Bad prediction - just stay near center
      return (Math.random() - 0.5) * 2;
    }

    // Clamp to valid range
    predictedZ = Math.max(tableZMin, Math.min(tableZMax, predictedZ));

    return predictedZ;
  }

  // Get next keyboard command
  getNextMove(gameState) {
    const now = Date.now();
    
    // Only update prediction once per second (REQUIREMENT)
    if (now - this.lastUpdate >= this.updateInterval) {
      this.lastUpdate = now;
      
      const { ball, aiPaddle, tableBounds } = gameState;
      
      // Predict where ball will be
      this.predictedZ = this.predictBallPosition(
        ball.x,
        ball.z,
        ball.velocityX,
        ball.velocityZ,
        aiPaddle.x,
        tableBounds.zMin,
        tableBounds.zMax
      );
    }

    // If no prediction yet, don't move
    if (this.predictedZ === null) {
      return 'NONE';
    }

    const paddleZ = gameState.aiPaddle.z;
    const difference = this.predictedZ - paddleZ;

    // Don't move if already close enough (deadzone)
    if (Math.abs(difference) < this.config.deadzone) {
      return 'NONE';
    }

    // Simulate keyboard input
    if (difference < 0) {
      return 'UP';    // Need to move in negative Z direction (W key)
    } else {
      return 'DOWN';  // Need to move in positive Z direction (S key)
    }
  }
}

// Route handler
export default async function aiRoutes(fastify, options) {
  
  // Health check
  fastify.get('/ai/health', async (request, reply) => {
    return { status: 'ok', service: 'ai-service' };
  });

  // Start AI game
  fastify.post('/ai/game/start', {
    preHandler: [fastify.authenticate],
    schema: startGameSchema
  }, async (request, reply) => {
    try {
      const { difficulty, aiSide } = request.body;
      const userId = request.user.id;

      const gameSession = await prisma.aIGameSession.create({
        data: {
          userId,
          aiDifficulty: difficulty,
          aiSide,
          playerScore: 0,
          aiScore: 0
        }
      });

      return {
        success: true,
        gameId: gameSession.id,
        difficulty,
        aiSide
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create AI game session' });
    }
  });

  // Get AI move (called every ~1 second from frontend)
  fastify.post('/ai/game/:gameId/move', {
    schema: getMoveSchema
  }, async (request, reply) => {
    try {
      const gameId = parseInt(request.params.gameId);
      const { gameState } = request.body;

      // Get game session to know difficulty
      const session = await prisma.aIGameSession.findUnique({
        where: { id: gameId }
      });

      if (!session) {
        return reply.code(404).send({ error: 'Game session not found' });
      }

      // Create AI with the session's difficulty
      const ai = new PongAI(session.aiDifficulty);
      
      // Get next move based on game state
      const move = ai.getNextMove(gameState);

      return {
        move, // 'UP', 'DOWN', or 'NONE'
        timestamp: Date.now()
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get AI move' });
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

  // Finish game and update stats
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

      const difficulty = gameSession.aiDifficulty;
      const isWin = winner === 'player';

      // Get or create stats
      let stats = await prisma.aIGameStats.findUnique({
        where: { userId }
      });

      if (stats) {
        // Calculate new streak
        const newStreak = isWin ? stats.currentStreak + 1 : 0;
        const longestStreak = Math.max(stats.longestWinStreak, newStreak);

        // Update existing stats
        stats = await prisma.aIGameStats.update({
          where: { userId },
          data: {
            totalAIGames: { increment: 1 },
            aiGamesWon: { increment: isWin ? 1 : 0 },
            aiGamesLost: { increment: isWin ? 0 : 1 },
            [`${difficulty}Wins`]: { increment: isWin ? 1 : 0 },
            [`${difficulty}Losses`]: { increment: isWin ? 0 : 1 },
            currentStreak: newStreak,
            longestWinStreak: longestStreak,
            lastPlayedAt: new Date()
          }
        });
      } else {
        // Create new stats
        stats = await prisma.aIGameStats.create({
          data: {
            userId,
            totalAIGames: 1,
            aiGamesWon: isWin ? 1 : 0,
            aiGamesLost: isWin ? 0 : 1,
            [`${difficulty}Wins`]: isWin ? 1 : 0,
            [`${difficulty}Losses`]: isWin ? 0 : 1,
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

  // Get AI game history for user
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

  // Get AI stats for user
  fastify.get('/ai/stats', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;

      let stats = await prisma.aIGameStats.findUnique({
        where: { userId }
      });

      if (!stats) {
        // Create default stats if none exist
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