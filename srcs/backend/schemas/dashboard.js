export const matchHistorySchema = {
	tags: ['Dashboard'],
	summary: 'Return match history for given user',
	headers: {
		type: 'object',
		properties: {
			'x-current-user-id': { type: 'integer' },
		},
		required: ['x-current-user-id'],
	},
	response: {
		200: {
		type: 'array',
		items: {
			type: 'object',
			properties: {
				date: { type: 'string', format: 'date-time' },
				opponent: { type: 'string' },
				opponentAvatar: { type: 'string' },
				userScore: { type: 'integer'},
				opponentScore: { type: 'integer'},
				result: { type: 'string', enum: ['WIN', 'LOSS'] },
				isTournament: { type: 'boolean' }
			},
			required: ['date', 'opponent', 'opponentAvatar','userScore', 'opponentScore', 'result', 'isTournament']
		}
		},
		404: { type: 'object', properties: { error: { type: 'string' }, }, },
		500: { type: 'object', properties: { error: { type: 'string' }, }, },
	}
}; 

