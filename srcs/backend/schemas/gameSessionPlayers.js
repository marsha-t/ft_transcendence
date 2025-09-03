export const joinSessionSchema = {
	params: {
		type: 'object',
		properties: {
			id: { type: 'integer' },
			playerId: { type: 'integer' },
		},
		required: ['id', 'playerId'],
	},
	body: {
		type: 'object',
		required: ['userId', 'side'],
		properties: {
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

export const listPlayersSessionSchema = {
	params: {
		type: 'object',
		properties: {
			id: { type: 'integer' },
		},
		required: ['id'],
	},
	response: {
		200: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					playerId: { type: 'integer' },
					userId: { type: 'integer' },
					username: { type: 'string' },
					side: { type: 'string', enum: ['LEFT', 'RIGHT'] },
					isReady: { type: 'boolean' },
					score: { type: 'integer' },
				},
			required: ['playerId', 'userId', 'username', 'side', 'isReady', 'score'],
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

export const updateScoreSchema = {
	params: {
		type: 'object',
		properties: {
			id: { type: 'integer' },
			playerId: { type: 'integer' },
		},
		required: ['id', 'playerId'],
	},
	response: {
		200: {
			type: 'object',
			properties: {
				id: { type: 'integer' },
				sessionId: { type: 'integer' },
				userId: { type: 'integer' },
				side: { type: 'string', enum: ['LEFT', 'RIGHT'] },
				isReady: { type: 'boolean' },
				score: { type: 'integer' },
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
	},
};

export const deletePlayerSchema = {
	params: {
    	type: 'object',
		properties: {
			id: { type: 'integer'},
			playerId: { type: 'integer' },
		},
		required: ['id', 'playerId'],
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
