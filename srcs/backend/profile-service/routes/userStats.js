import prisma from '../prisma/prismaClient.js';
import bcrypt from 'bcrypt';
import { updateLanguageSchema } from '../schemas/profile.js';

async function userStatsRoutes(app, options) {
  
  // Get current user info (username + avatar + defaultLanguage)
  app.get('/userInfo', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id; // extracted from JWT

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true, avatar: true, defaultLanguage: true },
      });

      if (!user) {
        return reply.code(404).send({ message: 'User not found' });
      }

      return reply.code(200).send({
        username: user.username,
        avatar: user.avatar || '../uploads/avatars/default.png',
        defaultLanguage: user.defaultLanguage,
      });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch user info' });
    }
  });

  // Update default language endpoint
  app.patch('/user/language', { schema: updateLanguageSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { language } = request.body;

      // Validate language
      const allowedLanguages = ['en', 'sp', 'ru'];
      if (!allowedLanguages.includes(language)) {
        return reply.code(400).send({ message: 'Invalid language' });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { defaultLanguage: language },
      });

      return reply.send({ message: 'Default language updated' });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to update language' });
    }
  });
  // Update user stats after game completion (called by Game Service)
  app.post('/users/:userId/stats', async (request, reply) => {
    try {
      const { userId } = request.params;
      const { won, score, opponentScore } = request.body;

      if (typeof won !== 'boolean' || typeof score !== 'number') {
        return reply.code(400).send({ error: 'Invalid request body' });
      }

      const user = await prisma.user.findUnique({
        where: { id: Number(userId) }
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      // Calculate new stats
      const totalMatches = user.totalMatches + 1;
      const totalWins = won ? user.totalWins + 1 : user.totalWins;
      const winRate = (totalWins / totalMatches) * 100;
      const avgScore = (user.avgScore * user.totalMatches + score) / totalMatches;

      const currentStreak = won ? user.currentWinStreak + 1 : 0;
      const longestStreak = Math.max(user.longestWinStreak, currentStreak);

      // Update user
      const updated = await prisma.user.update({
        where: { id: Number(userId) },
        data: {
          totalMatches,
          totalWins,
          winRate,
          avgScore,
          currentWinStreak: currentStreak,
          longestWinStreak: longestStreak,
          lastPlayedAt: new Date()
        },
        select: {
          totalMatches: true,
          totalWins: true,
          winRate: true,
          avgScore: true,
          currentWinStreak: true,
          longestWinStreak: true
        }
      });

      return reply.code(200).send({
        message: 'Stats updated successfully',
        stats: updated
      });

    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to update stats' });
    }
  });

  // Get user display info (called by Game Service when creating players)
  app.get('/users/:userId/info', async (request, reply) => {
    try {
      const { userId } = request.params;

      const user = await prisma.user.findUnique({
        where: { id: Number(userId) },
        select: {
          id: true,
          username: true,
          avatar: true,
          status: true
        }
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return reply.code(200).send(user);

    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch user info' });
    }
  });

  // Batch get user info (for dashboard/leaderboards)
  app.post('/users/batch-info', async (request, reply) => {
    try {
      const { userIds } = request.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return reply.code(400).send({ error: 'userIds must be a non-empty array' });
      }

      const users = await prisma.user.findMany({
        where: { id: { in: userIds.map(Number) } },
        select: {
          id: true,
          username: true,
          avatar: true,
          totalMatches: true,
          totalWins: true,
          winRate: true,
          avgScore: true
        }
      });

      return reply.code(200).send(users);

    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch users' });
    }
  });

  // Validate user credentials (for tournament registration)
  app.post('/users/validate', async (request, reply) => {
    try {
      const { username, password } = request.body;

      if (!username || !password) {
        return reply.code(400).send({ error: 'Username and password required' });
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true, username: true, password: true }
      });

      // Debug log (do NOT log passwords in production)
      request.log.info({ username }, 'Validate attempt for username');

      if (!user) {
        request.log.info({ username }, 'User not found');
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      request.log.info({ username, valid: isValid }, 'Password comparison result');
      if (!isValid) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Return user info (without password)
      return reply.code(200).send({
        id: user.id,
        username: user.username
      });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Validation failed' });
    }
  });
}

export default userStatsRoutes;
