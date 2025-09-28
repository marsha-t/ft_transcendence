// Create a game session
export const createGameSessionSchema = {
  tags: ['Game Session'],
  summary: 'Create game session with first player', 
	body: {
		type: 'object',
		required: ['side'],
		oneOf: [
			{ required: ['userId'] },
			{ required: ['guestName'] },
		],
			properties: {
			userId: { type: 'integer' },
			guestName: { type: 'string' },
			side: { type: 'string', enum: ['LEFT','RIGHT'] },
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

// Get all sessions
export const getAllGameSessionsSchema = {
	tags: ['Game Session'],
	summary: 'Get all sessions', 
	response: {
		200: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'integer' },
					status: { type: 'string', enum: ['CREATED', 'PLAYING', 'PAUSED', 'FINISHED', 'ABORTED'] },
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
								sessionId: { type: 'integer' },
								userId: { type: 'integer', nullable: true },
								isGuest: { type: 'boolean' },
								displayName: { type: 'string' },
								side: { type: 'string', enum: ['LEFT', 'RIGHT'] },
								score: { type: 'integer' },
							},
						},
					},
					winnerUser: {
						type: 'object',
						nullable: true,
						properties: {
							id: { type: 'integer' },
							username: { type: 'string' },
							email: { type: 'string' },
							avatar: { type: 'string' },
						},
					},
					winnerPlayer: {
						type: 'object',
						nullable: true,
						properties: {
							id: { type: 'integer' },
							displayName: { type: 'string' },
							side: { type: 'string', enum: ['LEFT', 'RIGHT'] },
							score: { type: 'integer' },
						},
					},
				},
			},
		},
	},
};


// Get one session by ID
export const getGameSessionByIdSchema = {
	tags: ['Game Session'],
	summary: 'Get one session by ID', 
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
				id: { type: 'integer' },
				status: { type: 'string', enum: ['CREATED', 'PLAYING', 'PAUSED', 'FINISHED', 'ABORTED'] },
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
							sessionId: { type: 'integer' },
							userId: { type: 'integer', nullable: true },
							isGuest: { type: 'boolean' },
							displayName: { type: 'string' },
							side: { type: 'string', enum: ['LEFT', 'RIGHT'] },
							score: { type: 'integer' },
						},
					},
				},
				winnerUser: {
					type: 'object',
					nullable: true,
					properties: {
						id: { type: 'integer' },
						username: { type: 'string' },
						email: { type: 'string' },
						avatar: { type: 'string' },
					},
				},
				winnerPlayer: {
					type: 'object',
					nullable: true,
					properties: {
						id: { type: 'integer' },
						displayName: { type: 'string' },
						side: { type: 'string', enum: ['LEFT', 'RIGHT'] },
						score: { type: 'integer' },
					},
				},
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

// Update session status
export const updateSessionStatusSchema = {
	tags: ['Game Session'],
	summary: 'Update game session status',
	params: {
		type: 'object',
		required: ['sessionId'],
		properties: {
		id: { type: 'integer' },
		},
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
				startedAt: { type: 'string', format: 'date-time', nullable: true },
				endedAt: { type: 'string', format: 'date-time', nullable: true },
				createdAt: { type: 'string', format: 'date-time' },
				players: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							id: { type: 'integer' },
							userId: { type: ['integer', 'null'] },
							isGuest: { type: 'boolean' },
							displayName: { type: 'string' },
							side: { type: 'string', enum: ['LEFT', 'RIGHT'] },
							score: { type: 'integer' },
						},
					},
				},
			},
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
