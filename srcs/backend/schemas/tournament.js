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
				status: { type: 'string' },
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
			{ required: ['guestName'] }
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
        status: { type: 'string' },
        startedAt: { type: ['string', 'null'], format: 'date-time' },
        endedAt: { type: ['string', 'null'], format: 'date-time' }
      }
    }
}
