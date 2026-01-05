import { PrismaClient } from '@prisma/client';

// Primary client points to user-social.db for User queries
const prismaUserData = new PrismaClient({
  datasources: {
    db: {
      url: 'file:/app/prisma/user-data/user-social.db',
    },
  },
});

// Secondary client points to game-tournament.db for Game queries
const prismaGameData = new PrismaClient({
  datasources: {
    db: {
      url: 'file:/app/prisma/game-data/game-tournament.db',
    },
  },
});

// Export both clients
export { prismaUserData, prismaGameData };
