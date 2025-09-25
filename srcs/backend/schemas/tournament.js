
// Create new tournament
export const createTournamentSchema = {
	tags: ['Tournament'],
	summary: 'Create a tournament', 
	body: {
		type: 'object',
		required: ['numberOfPlayers'],
		properties: {
		numberOfPlayers: { type: 'integer', minimum: 2, maximum: 64 } // set your own max
		}
	}, 
	response: {
		201: {
			type: 'object',
			properties: {
				id: { type: 'integer' },
				status: { type: 'string', enum: ['CREATED', 'STARTED', 'FINISHED', 'ABORTED'] },
        		createdAt: { type: 'string', format: 'date-time' },
      		}
		}
	}
}

// Add a player to tournament
export const joinTournamentSchema = {
	tags: ['Tournament'],
	summary: 'Add player to tournament', 
	params: {
		type: 'object',
		required: ['tournamentId'],
		properties: {
			tournamentId: { type: 'integer' }
		}
	}, 
	body: {
		type: 'object',
		properties: {
			username: { type: 'string', minLength: 3 },
			password: { type: 'string', minLength: 6 },
			guestName: { type: 'string', minLength: 1 }
		},
		oneOf: [
			{ required: ['username', 'password'] },
			{ required: ['guestName'] },
		],
		additionalProperties: false
	},
	response: {
		200: {
			type: 'object',
			properties: {
				id: { type: 'integer' },
				displayName: { type: 'string' },
      		}
		}
	}
};

// Update tournament status
export const updateTournamentStatusSchema = {
	tags: ['Tournament'],
	summary: 'Update tournament status', 
	params: {
		type: 'object',
		required: ['tournamentId'],
		properties: {
			tournamentId: { type: 'integer' }
    	}
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

// Get next match in a tournament
export const getNextMatchSchema = {
	tags: ['Tournament'],
	summary: 'Get next match',
	params: {
		type: 'object',
		required: ['tournamentId'],
		properties: { 
			tournamentId: { type: 'integer' },
		},
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
								matchIndex: { type: 'integer' },
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
