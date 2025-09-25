// Add player to game session
export const joinSessionSchema = {
	tags: ['Game Session'],
	summary: 'Add player to game session',
	headers: {
		type: 'object',
		properties: {
			'x-current-session-id': { type: 'string' },
			'x-current-user-id': { type: 'string' },
		},
		required: ['x-current-session-id'],
	},
	body: {
		type: 'object',
		required: ['side'],
		properties: {
		guestName: { type: 'string' },
		side: { type: 'string', enum: ['LEFT', 'RIGHT'] },
		},
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
				additionalProperties: false,
	},
			},
			additionalProperties: false,
		},
		400: { type: 'object', properties: { error: { type: 'string' }, }, additionalProperties: false, },
		404: { type: 'object', properties: { error: { type: 'string' }, }, additionalProperties: false, },
		409: { type: 'object', properties: { error: { type: 'string' }, }, additionalProperties: false, },
		500: { type: 'object', properties: { error: { type: 'string' }, }, additionalProperties: false, },
	},
};


// List players in session
export const listPlayersSessionSchema = {
	tags: ['Game Session'],
	summary: 'List players in session', 
	headers: {
		type: 'object',
		properties: {
			'x-current-session-id': { type: 'string' },
		},
		required: ['x-current-session-id'],
	},
	response: {
		200: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					playerId: { type: 'integer' },
					displayName: { type: 'string' },
					side: { type: 'string', enum: ['LEFT', 'RIGHT'] },
					isGuest: { type: 'boolean' },
					score: { type: 'integer' },
				},
			required: ['playerId', 'displayName', 'side', 'isGuest', 'score'],
			},
		},
		400: {
			type: 'object', 
			properties: {
				error: { type: 'string' },
				message : { type: 'string' }
			},
			additionalProperties: false,
		},
		404: {
			type: 'object', 
			properties: {
				error: { type: 'string' },
				message : { type: 'string' }
			},
			additionalProperties: false,
		},
	}
}

// Update player score
export const updateScoreSchema = {
	tags: ['Game Session'],
	summary: 'Update player score',
	headers: {
		type: 'object',
		properties: {
			'x-current-session-id': { type: 'string' },
			'x-player-side': { type: 'string', enum: ['LEFT', 'RIGHT'] },
		},
		required: ['x-current-session-id', 'x-player-side'],
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
					additionalProperties: false,
					},
				},
			},
			required: ['sessionId', 'status', 'players'],
			additionalProperties: false,
		},
		400: {
			type: 'object',
			properties: {
				error: { type: 'string' },
				message: { type: 'string' },
			},
			additionalProperties: false,
		},
		404: {
			type: 'object',
			properties: {
				error: { type: 'string' },
				message: { type: 'string' },
			},
			additionalProperties: false,
		},
	},
};

// Delete player
export const deletePlayerSchema = {
	tags: ['Game Session'],
	summary: 'Delete player', 
	headers: {
		type: 'object',
		properties: {
			'x-current-session-id': { type: 'string' },
			'x-player-side': { type: 'string', enum: ['LEFT', 'RIGHT'] },
		},
		required: ['x-current-session-id', 'x-player-side'],
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
				message : { type: 'string' }
			},
			additionalProperties: false,
		},
	},
};
