// schemas/auth.js

export const registerSchema = {
  tags: ['Authentication'],
  summary: 'Register a new user',
  body: {
    type: 'object',
    required: ['username', 'email', 'password'],
    properties: {
      username: { 
        type: 'string',
        minLength: 3,
        maxLength: 20,
        pattern: '^[a-zA-Z0-9_]+$'
      },
      email: { 
        type: 'string', 
        format: 'email',
        maxLength: 255
      },
      password: { 
        type: 'string',
        minLength: 12,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\W_]).{12,}$'
      }
    },
    additionalProperties: false
  },
  response: {
    201: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    },
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message : { type: 'string' }
      }
    },
    409: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

export const loginSchema = {
  tags: ['Authentication'],
  summary: 'Log in a user',
  body: {
    type: 'object',
    required: ['username', 'password'],
    properties: {
      username: { type: 'string', minLength: 3 },
      password: { type: 'string', minLength: 1 }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      }
    },
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' }, 
        message: { type: 'string' }
      }
    },
    401: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};
