// Add player to game session
export const joinSessionSchema = {
  	tags: ['Game Session'],
	summary: 'Add player to game session', 
	params: {
		type: 'object',
		properties: {
			id: { type: 'integer' },
		},
		required: ['id'],
	},
	body: {
		type: 'object',
		required: ['userId', 'side'],
		properties: {
			userId: { type: 'integer' },
			side: { type: 'string', enum: ['LEFT', 'RIGHT']},
		},
		additionalProperties: false,
	},
	response: {
		201: {
			type: 'object',
			required: ['id', 'sessionId', 'userId', 'side', 'isReady', 'score', 'user'],
			properties: {
				id: { type: 'integer' },
				sessionId: { type: 'integer' },
				userId: { type: 'integer' },
				side: { type: 'string', enum: ['LEFT', 'RIGHT'] },
				isReady: { type: 'boolean' },
				score: { type: 'integer' },
				user: {
					type: 'object',
					required: ['id', 'username'],
					properties: {
						id: { type: 'integer' },
						username: { type: 'string' },
					},
					additionalProperties: false,
				},
			additionalProperties: false,
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
		409: {
			type: 'object', 
			properties: {
				error: { type: 'string' },
				message : { type: 'string' }
			},
			additionalProperties: false,
		},
	}
}

// List players in session
export const listPlayersSessionSchema = {
	tags: ['Game Session'],
	summary: 'List players in session', 
	params: {
		type: 'object',
		properties: {
			sessionId: { type: 'integer' },
		},
		required: ['sessionId'],
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
	params: {
		type: 'object',
		properties: {
			sessionId: { type: 'integer' },
			side: { type: 'string', enum: ['LEFT', 'RIGHT'] },
		},
		required: ['sessionId', 'side'],
	},
	response: {
		200: {
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
	params: {
		type: 'object',
		properties: {
			sessionId: { type: 'integer'},
			side: { type: 'string', enum: ['LEFT', 'RIGHT'] },
		},
		required: ['sessionId', 'side'],
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
