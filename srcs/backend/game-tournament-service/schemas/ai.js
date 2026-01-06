// Create AI game
export const createAiGameSchema = {
	tags: ['AI'],
	summary: 'Create a game session against an AI opponent',
	body: {
		type: 'null',
	},
	response: {
		201: {
			type: 'object',
			required: ['sessionId', 'isAi', 'players'],
			properties: {
				sessionId: { type: 'number' },
				isAi: { type: 'boolean' },
				players: {
					type: 'array',
					minItems: 2,
					items: {
						type: 'object',
						required: ['side', 'displayName', 'score', 'isGuest'],
						properties: {
							side: { type: 'string', enum: ['LEFT', 'RIGHT'] },
							displayName: { type: 'string' },
							score: { type: 'number' },
							isGuest: { type: 'boolean' },
						},
					},
				},
			},
		},
	},
};
