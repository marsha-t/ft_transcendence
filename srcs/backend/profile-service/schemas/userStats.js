// schemas/userStats.js

export const getUserInfoSchema = {
  tags: ['UserStats'],
  summary: 'Fetch the authenticated user’s info (username, avatar, default language)',
  response: {
    200: {
      type: 'object',
      properties: {
        username: { type: 'string' },
        avatar: { type: 'string' },
        defaultLanguage: { type: 'string' }
      }
    }
  }
};

export const updateLanguageSchema = {
  tags: ['UserStats'],
  summary: 'Update default language',
  body: {
    type: 'object',
    required: ['language'],
    properties: {
      language: {
        type: 'string',
        enum: ['en', 'sp', 'ru']
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    }
  }
};

export const updateUserStatsSchema = {
  tags: ['UserStats'],
  summary: 'Update a user’s game stats after a match',
  params: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'integer', minimum: 1 }
    }
  },
  body: {
    type: 'object',
    required: ['won', 'score'],
    properties: {
      won: { type: 'boolean' },
      score: { type: 'number' },
      opponentScore: { type: 'number' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        stats: {
          type: 'object',
          properties: {
            totalMatches: { type: 'integer' },
            totalWins: { type: 'integer' },
            winRate: { type: 'number' },
            avgScore: { type: 'number' },
            currentWinStreak: { type: 'integer' },
            longestWinStreak: { type: 'integer' }
          }
        }
      }
    }
  }
};

export const getUserDisplayInfoSchema = {
  tags: ['UserStats'],
  summary: 'Fetch user display info (id, username, avatar, status) for game purposes',
  params: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'integer', minimum: 1 }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        username: { type: 'string' },
        avatar: { type: 'string' },
        status: { type: 'string' }
      }
    }
  }
};

export const batchUserInfoSchema = {
  tags: ['UserStats'],
  summary: 'Fetch info for multiple users at once (for dashboard/leaderboards)',
  body: {
    type: 'object',
    required: ['userIds'],
    properties: {
      userIds: {
        type: 'array',
        items: { type: 'integer' },
      }
    }
  },
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          username: { type: 'string' },
          avatar: { type: 'string' },
          totalMatches: { type: 'integer' },
          totalWins: { type: 'integer' },
          winRate: { type: 'number' },
          avgScore: { type: 'number' }
        }
      }
    }
  }
};

export const validateUserSchema = {
  tags: ['UserStats'],
  summary: 'Validate user credentials (username + password) for tournament registration',
  body: {
    type: 'object',
    required: ['username', 'password'],
    properties: {
      username: { type: 'string', minLength: 3 },
      password: { type: 'string', minLength: 6 }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        username: { type: 'string' }
      }
    }
  }
};