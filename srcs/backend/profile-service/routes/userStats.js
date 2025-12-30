import prisma from '../prisma/prismaClient.js';
import bcrypt from 'bcrypt';
import { updateLanguageSchema } from '../schemas/userStats.js';

async function userStatsRoutes(app) {
  
  // Get current user info (username, avatar, and defaultLanguage)
  /*
    Route to fetch the authenticated user's info.
    - Extracts user from the token
    - Returns username, avatar, and default language
  */  
  app.get('/userInfo', { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, avatar: true, defaultLanguage: true },
    });

    return reply.send({
      username: user.username,
      avatar: user.avatar || '../uploads/avatars/default.png',
      defaultLanguage: user.defaultLanguage,
    });
  });

  // Update default language
  /*
    Allows the authenticated user to update their default language.
    - Language validation
    - Responds with success message
  */
  app.patch('/user/language', { schema: updateLanguageSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.id;
    const { language } = request.body;

    // Validate language
    const allowedLanguages = ['en', 'sp', 'ru'];
    if (!allowedLanguages.includes(language)) {
      const err = new Error('Invalid language');
      err.statusCode = 400;
      err.code = 'INVALID_LANGUAGE';
      throw err;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { defaultLanguage: language },
    });

    return reply.send({ message: 'Default language updated' });
  });

  // Update user stats after game completion
  /*
    Updates the stats of a user after a game.
    - Calculates win rate, total matches, average score, etc.
    - Responds with updated user stats
  */
  app.post('/users/:userId/stats', async (request, reply) => {
    const { userId } = request.params;
    const { won, score, opponentScore } = request.body;

    if (typeof won !== 'boolean' || typeof score !== 'number') {
      return reply.code(400).send({ error: 'Invalid request body' });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
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

    return reply.send({
      message: 'Stats updated successfully',
      stats: updated
    });
  });

  // Get user display info (called by Game Service when creating players)
  /*
    Fetches user's display information for game purposes
    - Returns username, avatar, status
  */
  app.get('/users/:userId/info', async (request, reply) => {
    const { userId } = request.params;

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { id: true, username: true, avatar: true, status: true }
    });

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    return reply.send(user);
  });

  // Batch get user info (for dashboard/leaderboards)
  /*
    Fetches info for multiple users at once
    - Accepts an array of userIds and returns their details
  */
  app.post('/users/batch-info', async (request, reply) => {
    const { userIds } = request.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      const err = new Error('userIds must be a non-empty array');
      err.statusCode = 400;
      err.code = 'INVALID_USER_IDS';
      throw err;
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

    return reply.send(users);
  });

  // Validate user credentials (for tournament registration)
  /*
    Validates user's credentials for tournament registration
    - Checks username and password
  */
  app.post('/users/validate', async (request, reply) => {
    const { username, password } = request.body;

    if (!username || !password) {
      const err = new Error('Username and password required');
      err.statusCode = 400;
      err.code = 'MISSING_CREDENTIALS';
      throw err;
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, password: true }
    });

    if (!user) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    return reply.send({
      id: user.id,
      username: user.username
    });
  });
}

export default userStatsRoutes;
