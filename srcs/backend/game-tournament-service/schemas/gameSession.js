// Create a game session
export const createGameSessionSchema = {
	tags: ['Game Session'],
	summary: 'Create game session with first player', 
	headers: {
		type: 'object',
		},
	body: {
		type: 'object',
		required: ['side'],
		properties: {
			guestName: { type: 'string', maxLength: 20 },
			side: { type: 'string', enum: ['LEFT', 'RIGHT'] },
		},
	},
	response: {
		201: {
			type: 'object',
			properties: {
				id: { type: 'integer' },
				status: { type: 'string', enum: ['CREATED','PLAYING','PAUSED','FINISHED','ABORTED'] },
				createdAt: { type: 'string', format: 'date-time' },
				startedAt: { type: 'string', format: 'date-time', nullable: true },
				endedAt: { type: 'string', format: 'date-time', nullable: true },
				winnerUserId: { type: 'integer', nullable: true },
				winnerPlayerId: { type: 'integer', nullable: true },
				players: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							id: { type: 'integer' },
							userId: { type: 'integer', nullable: true },
							isGuest: { type: 'boolean' },
							displayName: { type: 'string' },
							side: { type: 'string', enum: ['LEFT','RIGHT'] },
							score: { type: 'integer' },
						},
					},
				},
			},
		},
  	},
};

// Update session status
export const updateSessionStatusSchema = {
	tags: ['Game Session'],
	summary: 'Update game session status',
	headers: {
		type: 'object',
		properties: {
			'x-current-session-id': { type: 'string' },
		  },	  
		required: ['x-current-session-id'],
	},
	body: {
		type: 'object',
		required: ['status'],
		properties: {
			status: {
				type: 'string',
				enum: ['PLAYING', 'PAUSED', 'ABORTED'],
			},
		},
		additionalProperties: false,
	},
	response: {
		200: {
			type: 'object',
			properties: {
			  id: { type: 'integer' },
			  status: { type: 'string' },
			  endedAt: { type: ['string', 'null'], format: 'date-time' },
			  winnerUserId: { type: ['integer', 'null'] },
			  winnerPlayerId: { type: ['integer', 'null'] },
			  players: {
				type: 'array',
				items: {
				  type: 'object',
				  properties: {
					id: { type: 'integer' },
					sessionId: { type: 'integer' },
					userId: { type: ['integer', 'null'] },
					displayName: { type: 'string' },
					side: { type: 'string', enum: ['LEFT', 'RIGHT'] },
					isGuest: { type: 'boolean' },
					score: { type: 'integer' },
				  },
				  required: ['id', 'sessionId', 'side', 'isGuest', 'score'],
				},
			  },
			},
			required: ['id', 'status', 'players'],
		},
		400: {
			type: 'object',
			properties: {
				error: { type: 'string' },
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
