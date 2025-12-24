
// Validate player
export const validatePlayerSchema = {
	tags: ['Tournament'],
	summary: 'Validate tournament player',
	body: {
		type: 'object',
		anyOf: [
			{
			  required: ['username', 'password'],
			},
			{
			  required: ['guestName'],
			},
		],
		properties: {
			username: {
				type: 'string',
				minLength: 3,
				errorMessage: {
					minLength: 'Username must be at least 3 characters'
				}
			},
			password: {
				type: 'string',
				minLength: 1,
				errorMessage: {
					minLength: 'Password is required'
				}
			},
			guestName: {
				type: 'string',
				minLength: 3,
				maxLength: 20,
				pattern: '^[a-zA-Z0-9_]+$',
				errorMessage: {
				  minLength: 'Guest name must be at least 3 characters',
				  maxLength: 'Guest name must not exceed 20 characters',
				  pattern: 'Guest name can only contain letters, numbers, and underscores',
				},
			},
		},
		additionalProperties: false,
	},
	response: {
		200: {
			type: 'object',
			properties: {
				valid: { type: 'boolean' },
				displayName: { type: 'string' },
				userId: { type: ['integer', 'null']},
			},
			required: ['valid', 'displayName', 'userId'],
		},
	},
};

// Finalise tournament details
export const finalizeTournamentSchema = {
	tags: ['Tournament'],
	summary: 'Create tournament and its structure',
	body: {
		type: 'object',
		required: ['numberOfPlayers', 'players'],
		properties: {
			numberOfPlayers: { type: 'integer', minimum: 2 },
			players: {
				type: 'array',
				items: {
					type: 'object',
					required: ['displayName'],
					properties: {
						displayName: { type: 'string', maxLength: 20 },
						userId: { type: ['integer', 'null'] },
					},
				},
			},
		},
		additionalProperties: false,
	},
	response: {
		201: {
			type: 'object',
			properties: {
				id: { type: 'integer' },
				status: { type: 'string', enum: ['CREATED', 'STARTED', 'FINISHED', 'ABORTED'] },
			},
			required: ['id', 'status'],
		},
	},
};

// Get next match in a tournament
export const getNextMatchSchema = {
	tags: ['Tournament'],
	summary: 'Get next match',
	headers: {
    	type: 'object',
		properties: {
			'x-current-tournament-id': { type: 'string', pattern: '^[0-9]+$',}, 
		},
	    required: ['x-current-tournament-id'],
  	},
	response: {
		200: {
			type: 'object',
			properties: {
				tournamentId: { type: 'integer' },
				status: { type: 'string', enum: ['FINISHED'], nullable: true },
				nextMatch: {
					anyOf: [
						{
							type: 'object',
							properties: {
								matchId: { type: 'integer' },
								matchIndex: { type: 'integer' },
								tournamentId: { type: 'integer' },
								player1: { 
									anyOf: [ { type: 'object', properties: { id: { type: 'integer' }, displayName: { type: 'string' }, }, required: ['id', 'displayName'], },
											{ type: 'null' }, ],
								},
								player2: {
									anyOf: [ { type: 'object', properties: { id: { type: 'integer' }, displayName: { type: 'string' }, }, required: ['id', 'displayName'], },
											{ type: 'null' }, ],
								},
								gameSessionId: { type: ['integer', 'null'] },
								gameStatus: {
									type: ['string', 'null'],
									enum: ['CREATED', 'PLAYING', 'PAUSED', 'FINISHED', 'ABORTED', null],
								},
							},
							required: ['matchIndex', 'player1', 'player2', 'gameSessionId', 'gameStatus'],
						},
						{ type: 'null' },
					],
				},
				results: {
					type: ['object', 'null'],
					properties: { 
						champion: { type: ['string', 'null'] },
						bracket: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
								matchIndex: { type: 'integer' },
								player1: { type: ['string', 'null'] },
								player2: { type: ['string', 'null'] },
								winner: { type: ['string', 'null'] },
								},
								required: ['matchIndex', 'player1', 'player2', 'winner'],
							},
						},
						stats: {
							type: 'object',
							properties: {
								totalMatches: { type: 'integer' },
								playedMatches: { type: 'integer' },
							},
							required: ['totalMatches', 'playedMatches'],
						},
					},
				}
			},
			required: ['tournamentId', 'nextMatch'],
		},
	},
};

// Update tournament status
export const updateTournamentStatusSchema = {
	tags: ['Tournament'],
	summary: 'Update tournament status', 
	headers: {
    	type: 'object',
		properties: {
			'x-current-tournament-id': { type: 'string', pattern: '^[0-9]+$',}, 
		},
	    required: ['x-current-tournament-id'],
  	},
	body: {
		type: 'object',
		required: ['status'],
		properties: {
			status: { type: 'string', enum: ['CREATED', 'STARTED', 'FINISHED', 'ABORTED'] }
		},
		additionalProperties: false,
	},
	response: {
		200: {
			type: 'object',
			properties: {
				id: { type: 'integer' },
				status: { type: 'string', enum: ['CREATED', 'STARTED', 'FINISHED', 'ABORTED'] },
				startedAt: { type: ['string', 'null'], format: 'date-time' },
				endedAt: { type: ['string', 'null'], format: 'date-time' }
			}
		}
	}
}