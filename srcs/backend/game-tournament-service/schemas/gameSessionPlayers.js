// Add player to game session
export const joinSessionSchema = {
	tags: ['Game Session'],
	summary: 'Add player to game session',
	headers: {
		type: 'object',
		properties: {
			'x-current-session-id': { type: 'string', pattern: '^[0-9]+$', },
		  },	  
		required: ['x-current-session-id'],
	},
	body: {
		type: 'object',
		properties: {
		  guestName: { 
			type: 'string', 
			minLength: 3, 
			maxLength: 20, 
			pattern: '^[a-zA-Z0-9_]+$',
			errorMessage: {
				minLength: 'Username must be at least 3 characters',
				maxLength: 'Username must not exceed 20 characters',
				pattern: 'Username can only contain letters, numbers, and underscores'
			}
		  },
		  side: { 
			type: 'string', 
			enum: ['LEFT', 'RIGHT'], 
		  },
		},
		required: ['guestName', 'side'],
		additionalProperties: false,
	},
	response: {
		201: {
			type: 'object',
			properties: {
				id: { type: 'integer' },
				sessionId: { type: 'integer' },
				userId: { type: ['integer', 'null'] },
				side: { type: 'string', enum: ['LEFT', 'RIGHT'] },
				isReady: { type: 'boolean' },
				score: { type: 'integer' },
				displayName: { type: 'string' },
				isGuest: { type: 'boolean' },
				user: {
					type: ['object', 'null'],
					properties: {
						id: { type: 'integer' },
						username: { type: 'string' },
					},
				},
			},
		},
	},
};

// Update player score
export const updateScoreSchema = {
	tags: ['Game Session'],
	summary: 'Update player score',
	headers: {
		type: 'object',
		properties: {
			'x-current-session-id': { type: 'string', pattern: '^[0-9]+$', },
			'x-player-side': { type: 'string', enum: ['LEFT', 'RIGHT'] },
		},
		required: ['x-current-session-id', 'x-player-side'],
	},
	body: {
		type: 'null',
	},
	response: {
		200: {
			type: 'object',
			properties: {
				sessionId: { type: 'string' },                // stringified ID
				status: { type: 'string', enum: ['PLAYING', 'PAUSED', 'FINISHED', 'ABORTED'] },
				createdAt: { type: ['string', 'null'], format: 'date-time' },
				startedAt: { type: ['string', 'null'], format: 'date-time' },
				endedAt: { type: ['string', 'null'], format: 'date-time' },
				winner: { type: ['string', 'null'], enum: ['LEFT', 'RIGHT', null] },
				winnerName: { type: ['string', 'null'] },
				players: {
					type: 'array',
					items: {
					type: 'object',
					properties: {
						userId: { type: ['string', 'null'] },
						guestName: { type: ['string', 'null'] },
						displayName: { type: 'string' },
						side: { type: 'string', enum: ['LEFT', 'RIGHT'] },
						score: { type: 'integer' },
					},
					required: ['displayName', 'side', 'score'],
					},
				},
			},
			required: ['sessionId', 'status', 'players'],
		},
	},
};
