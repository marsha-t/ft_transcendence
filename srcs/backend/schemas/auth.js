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
        pattern: '^[a-zA-Z0-9_]+$',
        errorMessage: {
          minLength: 'Username must be at least 3 characters',
          maxLength: 'Username must not exceed 20 characters',
          pattern: 'Username can only contain letters, numbers, and underscores'
        }
      },
      email: {
        type: 'string',
        format: 'email',
        maxLength: 255,
        errorMessage: {
          format: 'Invalid email format',
          maxLength: 'Email must not exceed 255 characters'
        }
      },
      password: {
        type: 'string',
        minLength: 12,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\W_]).{12,}$',
        errorMessage: {
          minLength: 'Password must be at least 12 characters',
          pattern: 'Password must include uppercase, lowercase, number, and symbol'
        }
      }
    },
    additionalProperties: false,
    errorMessage: {
      required: {
        username: 'Username is required',
        email: 'Email is required',
        password: 'Password is required'
      },
      additionalProperties: 'No extra fields are allowed'
    }
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
        message: { type: 'string' },
        validation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
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
