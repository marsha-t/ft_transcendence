// schemas/ai.js

export const startGameSchema = {
    body: {
      type: 'object',
      required: ['difficulty', 'aiSide'],
      properties: {
        difficulty: { 
          type: 'string', 
          enum: ['easy', 'medium', 'hard'],
          description: 'AI difficulty level'
        },
        aiSide: { 
          type: 'string', 
          enum: ['left', 'right'],
          description: 'Which side the AI plays on'
        }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          gameId: { type: 'integer' },
          difficulty: { type: 'string' },
          aiSide: { type: 'string' }
        }
      }
    }
  };
  
  export const getMoveSchema = {
    params: {
      type: 'object',
      required: ['gameId'],
      properties: {
        gameId: { type: 'string' }
      }
    },
    body: {
      type: 'object',
      required: ['gameState'],
      properties: {
        gameState: {
          type: 'object',
          required: ['ball', 'aiPaddle', 'tableBounds'],
          properties: {
            ball: {
              type: 'object',
              required: ['x', 'z', 'velocityX', 'velocityZ'],
              properties: {
                x: { type: 'number' },
                z: { type: 'number' },
                velocityX: { type: 'number' },
                velocityZ: { type: 'number' }
              }
            },
            playerPaddle: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                z: { type: 'number' }
              }
            },
            aiPaddle: {
              type: 'object',
              required: ['x', 'z'],
              properties: {
                x: { type: 'number' },
                z: { type: 'number' }
              }
            },
            tableBounds: {
              type: 'object',
              required: ['zMin', 'zMax'],
              properties: {
                zMin: { type: 'number' },
                zMax: { type: 'number' }
              }
            }
          }
        }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          move: { 
            type: 'string',
            enum: ['UP', 'DOWN', 'NONE']
          },
          timestamp: { type: 'number' }
        }
      }
    }
  };
  
  export const updateScoreSchema = {
    params: {
      type: 'object',
      required: ['gameId'],
      properties: {
        gameId: { type: 'string' }
      }
    },
    body: {
      type: 'object',
      required: ['playerScore', 'aiScore'],
      properties: {
        playerScore: { type: 'integer' },
        aiScore: { type: 'integer' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          game: { type: 'object' }
        }
      }
    }
  };
  
  export const finishGameSchema = {
    params: {
      type: 'object',
      required: ['gameId'],
      properties: {
        gameId: { type: 'string' }
      }
    },
    body: {
      type: 'object',
      required: ['winner', 'playerScore', 'aiScore'],
      properties: {
        winner: { 
          type: 'string',
          enum: ['player', 'ai']
        },
        playerScore: { type: 'integer' },
        aiScore: { type: 'integer' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          gameSession: { type: 'object' },
          stats: { type: 'object' }
        }
      }
    }
  };