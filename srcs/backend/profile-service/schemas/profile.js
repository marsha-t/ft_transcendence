// schemas/profile.js

export const getCurrentUserSchema = {
  tags: ['Profile'],
  summary: 'Fetch currently authenticated user',
  headers: {
    type: 'object',
  },
  response: {
    200: {
      type: 'object',
      properties: {
        username: { type: 'string' },
        email: { type: 'string' },
        avatar: { type: 'string' },
        hasPassword: { type: 'boolean' },
        isGoogleUser: { type: 'boolean' },
      },
      required: ['username', 'avatar', 'email', 'hasPassword', 'isGoogleUser'],
    },
    400: {
      type: 'object',
      properties: { error: { type: 'string' } },
    },
    401: {
      type: 'object',
      properties: { error: { type: 'string' } },
    },
    404: {
      type: 'object',
      properties: { error: { type: 'string' } },
    },
    500: {
      type: 'object',
      properties: { error: { type: 'string' } },
    },
  },
};

  export const getPlayCountsSchema = {
    tags: ['Profile'],
    summary: 'Get user play counts within a date range',
    headers: {
      type: 'object',
    },
    querystring: {
      type: 'object',
      properties: {
        start: { type: 'string', format: 'date' },
        end: { type: 'string', format: 'date' }
      },
      required: ['start', 'end']
    },
    response: {
      200: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            date: { type: 'string', format: 'date' },
            count: { type: 'integer' }
          },
          required: ['date', 'count']
        }
      },
      400: {
        type: 'object',
        properties: { error: { type: 'string' } },
      },
      401: {
        type: 'object',
        properties: { error: { type: 'string' } },
      }
    }
  };
export const updateProfileSchema = {
  tags: ['Profile'],
  summary: 'Update username, password, or email of the current user',
  headers: {
    type: 'object',
  },
  body: {
    type: 'object',
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
      oldPassword: {
        type: 'string'
      },
      newPassword: {
        type: 'string',
        minLength: 12,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\W_]).{12,}$',
        errorMessage: {
          minLength: 'New password must be at least 12 characters',
          pattern: 'New password must include uppercase, lowercase, number, and symbol'
        }
      },
      newEmail: { 
        type: 'string', 
        format: 'email',
        maxLength: 255,
        errorMessage: {
          format: 'Invalid email format',
          maxLength: 'Email must not exceed 255 characters'
        }
      }
    },
    additionalProperties: false,
  },
  response: {
    200: { type: 'object', properties: { message: { type: 'string' }, data: { type: 'object' } } },
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
    401: { type: 'object', properties: { message: { type: 'string' } } },
    404: { type: 'object', properties: { message: { type: 'string' } } },
    409: { type: 'object', properties: { message: { type: 'string' } } },
    500: { type: 'object', properties: { message: { type: 'string' } } },
  },
};

export const avatarUploadSchema = {
  tags: ['Profile'],
  summary: 'Upload or update the avatar of the current user',
  headers: {
    type: 'object',
  },
  consumes: ['multipart/form-data'],
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        avatar: { type: 'string' },
      },
    },
    400: {
      type: 'object',
      properties: { error: { type: 'string' } },
    },
    500: {
      type: 'object',
      properties: { error: { type: 'string' } },
    },
  },
};

export const removeAvatarSchema = {
  tags: ['Profile'],
  summary: 'Remove user avatar and reset to default',
  headers: {
    type: 'object',
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        avatar: { type: 'string' } // path to default avatar
      }
    },
    404: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    },
    500: {
      type: 'object',
      properties: { error: { type: 'string' } },
    },
  },
};