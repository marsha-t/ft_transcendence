export const matchHistorySchema = {
	tags: ['Dashboard'],
	summary: 'Return match history for given user',
	params: {
		type: 'object',
		required: ['id'],
		properties: {
			id: { type: 'integer' }
		}
	},
	response: {
		200: {
		type: 'array',
		items: {
			type: 'object',
			properties: {
				date: { type: 'string', format: 'date-time' },
				opponent: { type: 'string' },
				userScore: { type: 'integer'},
				opponentScore: { type: 'integer'},
				result: { type: 'string', enum: ['WIN', 'LOSS'] },
				isTournament: { type: 'boolean' }
			},
			required: ['date', 'opponent', 'userScore', 'opponentScore', 'result', 'isTournament']
		}
		},
		404: { type: 'object', properties: { error: { type: 'string' }, }, },
		500: { type: 'object', properties: { error: { type: 'string' }, }, },
	}
};

