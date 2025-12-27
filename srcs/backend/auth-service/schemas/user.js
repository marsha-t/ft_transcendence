// schemas/user.js

export const updateLanguageSchema = {
  tags: ['User'],
  summary: 'Update default language',
  body: {
    type: 'object',
    required: ['language'],
    properties: {
      language: {
        type: 'string',
        enum: ['en', 'sp', 'ru']
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    },
    400: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    }
  }
};
