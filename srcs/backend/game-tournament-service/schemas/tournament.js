// Update tournament status
export const updateTournamentStatusSchema = {
	tags: ['Tournament'],
	summary: 'Update tournament status', 
	headers: {
    	type: 'object',
		properties: {
			'x-current-tournament-id': { type: 'string'}, 
		},
	    required: ['x-current-tournament-id'],
  	},
	body: {
		type: 'object',
		required: ['status'],
		properties: {
			status: { type: 'string', enum: ['CREATED', 'STARTED', 'FINISHED', 'ABORTED'] }
		}
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

// Validate player
export const validatePlayerSchema = {
	tags: ['Tournament'],
	summary: 'Validate tournament player',
	headers: {
    	type: 'object',
	},
	body: {
		type: 'object',
		required: ['username', 'password'],
		properties: {
			username: { type: 'string' },
			password: { type: 'string' },
		},
		additionalProperties: false,
	},
	response: {
		200: {
			type: 'object',
			properties: {
				valid: { type: 'boolean' },
				displayName: { type: 'string' },
				userId: { type: 'integer' },
			},
			required: ['valid', 'displayName', 'userId'],
		},
	},
};

// Finalise tournament details
export const finalizeTournamentSchema = {
	headers: {
    	type: 'object',
	},
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
					additionalProperties: false,
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
			'x-current-tournament-id': { type: 'string'}, 
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
		404: { type: 'object', properties: { error: { type: 'string' }, }, },
		500: { type: 'object', properties: { error: { type: 'string' }, }, },
	},
};
