export const matchHistorySchema = {
	tags: ['Dashboard'],
	summary: 'Return match history for given user',
	headers: {
		type: 'object',
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

export const gameDashboardSchema = {
  tags: ["Dashboard"],
  summary: "Return game dashboard for a finished game session",
  headers: {
    type: "object",
    properties: {
			authorization: { type: 'string', description: 'Bearer <token>' },
      "x-current-session-id": { type: "integer" },
    },
    required: ['authorization', "x-current-session-id" ],
  },
  response: {
    200: {
      type: "object",
      properties: {
        summary: {
          type: "object",
          properties: {
            sessionId: { type: "integer" },
            status: {
              type: "string",
              enum: ["CREATED", "PLAYING", "PAUSED", "FINISHED", "ABORTED"],
            },
            startedAt: { type: "string", format: "date-time" },
            endedAt: { type: "string", format: "date-time" },
            totalDurationSec: { type: "number" },
            activeDurationSec: { type: "number" },
            finalScore: {
              type: "object",
              properties: {
                left: { type: "integer" },
                right: { type: "integer" },
              },
              required: ["left", "right"],
            },
            winner: {
              type: ["object", "null"],
              properties: {
                displayName: { type: "string" },
                avatar: { type: "string" },
                side: { type: "string", enum: ["LEFT", "RIGHT"] },
              },
              required: ["displayName", "avatar", "side"],
            },
          },
          required: [
            "sessionId",
            "status",
            "startedAt",
            "endedAt",
            "totalDurationSec",
            "activeDurationSec",
            "finalScore",
          ],
        },
        players: {
          type: "array",
          items: {
            type: "object",
            properties: {
              displayName: { type: "string" },
              side: { type: "string", enum: ["LEFT", "RIGHT"] },
              avatar: { type: "string" },
              score: { type: "integer" },
              timeToFirstPointSec: { type: ["number", "null"] },
              avgTimePerPointSec: { type: ["number", "null"] },
              totalMatches: { type: "integer" },
              totalWins: { type: "integer" },
              winRate: { type: "number" },
            },
            required: [
              "displayName",
              "side",
              "avatar",
              "score",
              "totalMatches",
              "totalWins",
              "winRate",
            ],
          },
        },
        timeline: {
          type: "array",
          items: {
            type: "object",
            properties: {
              elapsedSec: { type: "number" },
              scoreLeft: { type: "integer" },
              scoreRight: { type: "integer" },
              scorerSide: {
                type: ["string", "null"],
                enum: ["LEFT", "RIGHT", null],
              },
            },
            required: ["elapsedSec", "scoreLeft", "scoreRight", "scorerSide"],
          },
        },
      },
      required: ["summary", "players", "timeline"],
    },
    400: { type: "object", properties: { error: { type: "string" } } },
    404: { type: "object", properties: { error: { type: "string" } } },
    500: { type: "object", properties: { error: { type: "string" } } },
  },
};

export const userDashboardSchema = {
  tags: ["Dashboard"],
  summary: "Return overall user dashboard stats",
  headers: {
    type: "object",
    properties: {
			authorization: { type: 'string', description: 'Bearer <token>' },
    },
    required: ["authorization"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        overview: {
          type: "object",
          properties: {
            totalMatches: { type: "integer" },
            totalWins: { type: "integer" },
            winRate: { type: "number" },
            avgScore: { type: "number" },
            currentWinStreak: { type: "integer" },
            longestWinStreak: { type: "integer" },
            lastPlayedAt: { type: ["string", "null"], format: "date-time" },
          },
          required: [
            "totalMatches",
            "totalWins",
            "winRate",
            "avgScore",
            "currentWinStreak",
            "longestWinStreak",
            "lastPlayedAt",
          ],
        },
        dailyStats: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: "string", format: "date" },
              winRate: { type: "number" },
            },
            required: ["date", "winRate"],
          },
        },
        scoreDistribution: {
          type: "array",
          items: { type: "integer" },
        },
        winsPerOpponent: {
          type: "array",
          items: {
            type: "object",
            properties: {
              opponent: { type: "string" },
              winRate: { type: "number" },
              total: { type: "integer" },
            },
            required: ["opponent", "winRate", "total"],
          },
        },

        leaderboard: {
          type: "array",
          items: {
            type: "object",
            properties: {
              username: { type: "string" },
              totalMatches: { type: "integer" },
              winRate: { type: "number" },
              avgScore: { type: "number" },
              leaderboardScore: { type: "number" },
            },
            required: [
              "username",
              "totalMatches",
              "winRate",
              "avgScore",
              "leaderboardScore",
            ],
          },
        },
      },
      required: [
        "overview",
        "dailyStats",
        "scoreDistribution",
        "winsPerOpponent",
        "leaderboard",
      ],
    },
    404: { type: "object", properties: { error: { type: "string" } } },
    500: { type: "object", properties: { error: { type: "string" } } },
  },
};
