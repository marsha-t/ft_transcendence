// Reusable session object schema
const gameSessionObject = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    status: { type: 'string', enum: ['CREATED','READY','PLAYING','PAUSED','FINISHED','ABORTED'] },
    maxScore: { type: 'integer' },
    createdAt: { type: 'string', format: 'date-time' },
    startedAt: { type: 'string', format: 'date-time', nullable: true },
    endedAt: { type: 'string', format: 'date-time', nullable: true },
    winnerUserId: { type: 'integer', nullable: true },
  }
};

// Create session
export const createGameSessionSchema = {
  tags: ['Game Session'],
  summary: 'Create game session', 
	body: {
		type: 'object',
		properties: {
			maxScore: { type: 'integer', minimum: 1},
		},
	},
	response: {
		201: gameSessionObject,
	}
}

// Get all sessions
export const getAllGameSessionsSchema = {
  tags: ['Game Session'],
  summary: 'Get all sessions', 
  response: {
    200: {
      type: 'array',
      items: gameSessionObject,
    },
  },
};

// Get one session by ID
export const getGameSessionByIdSchema = {
  tags: ['Game Session'],
  summary: 'Create one session by ID', 
  params: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
    },
    required: ['id'],
  },
  response: {
    200: gameSessionObject,
    404: {
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
  },
};

// Delete session
export const deleteGameSessionSchema = {
  tags: ['Game Session'],
  summary: 'Delete game session', 
  params: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
    },
    required: ['id'],
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    404: {
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
  },
};

export const updateSessionStatusSchema = {
  tags: ['Game Session'],
  summary: 'Update game session status', 
	params: {
		type: 'object',
		required: ['id'],
		properties: {
			id: { type: 'integer' },
		}
	},
	body: {
		type: 'object',
		required: ['status'],
		properties: {
			status: {
				type: 'string',
				enum: ['CREATED', 'READY', 'PLAYING', 'PAUSED', 'FINISHED', 'ABORTED']
			},
			winnerUserId: { type: 'number' },
		},
		additionalProperties: false
	},
	response: {
		200: gameSessionObject, 
		400: {
			type: 'object', 
			properties: {
				error: { type: 'string'},
			}
		},
		404: {
			type: 'object', 
			properties: {
				error: { type: 'string'},
			}
		}
	},
}