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
    200: { type: 'object', properties: { message: { type: 'string' }, data: { type: 'object' } } }
  }
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
      }
    }
  }
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
        avatar: { type: 'string' }
      }
    }
  }
};
