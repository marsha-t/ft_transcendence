// schemas/profile.js

export const getCurrentUserSchema = {
  tags: ['Profile'],
  summary: 'Fetch currently authenticated user',
  headers: {
    type: 'object',
    properties: {
      'x-current-user-id': { type: 'string' },
    },
    required: ['x-current-user-id'],
  },
  response: {
    200: {
      type: 'object',
      properties: {
        username: { type: 'string' },
        avatar: { type: 'string' },
      },
      required: ['username', 'avatar'],
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

export const changeUsernameSchema = {
  tags: ['Profile'],
  summary: 'Change the username of the current user',
  headers: {
    type: 'object',
    properties: {
      'x-current-user-id': { type: 'string' },
    },
    required: ['x-current-user-id'],
  },
  body: {
    type: 'object',
    required: ['username'],
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
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        username: { type: 'string' },
      },
    },
    400: {
      type: 'object',
      properties: { error: { type: 'string' } },
    },
    409: {
      type: 'object',
      properties: { error: { type: 'string' } },
    },
    500: {
      type: 'object',
      properties: { error: { type: 'string' } },
    },
  },
};

export const changePasswordSchema = {
  tags: ['Profile'],
  summary: 'Change the password of the current user',
  headers: {
    type: 'object',
    properties: {
      'x-current-user-id': { type: 'string' },
    },
    required: ['x-current-user-id'],
  },
  body: {
    type: 'object',
    required: ['oldPassword', 'newPassword'],
    properties: {
      oldPassword: {
        type: 'string',
        minLength: 1,
        errorMessage: {
          minLength: 'Old password is required'
        }
      },
      newPassword: { 
        type: 'string',
        minLength: 12,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\W_]).{12,}$',
        errorMessage: {
          minLength: 'New password must be at least 12 characters',
          pattern: 'New password must include uppercase, lowercase, number, and symbol'
        }
      }
    }
  },
  response: {
    200: { type: 'object', properties: { message: { type: 'string' } } },
    400: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
    401: { type: 'object', properties: { error: { type: 'string' } } },
    404: { type: 'object', properties: { error: { type: 'string' } } },
    500: { type: 'object', properties: { error: { type: 'string' } } },
  },
};

export const changeEmailSchema = {
  tags: ['Profile'],
  summary: 'Change the email address of the current user',
  headers: {
    type: 'object',
    properties: {
      'x-current-user-id': { type: 'string' },
    },
    required: ['x-current-user-id'],
  },
  body: {
    type: 'object',
    required: ['newEmail', 'password'],
    properties: {
      newEmail: { 
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
        minLength: 1,
        errorMessage: {
          minLength: 'Password is required'
        }
      },
    },
  },
  response: {
    200: { type: 'object', properties: { message: { type: 'string' } } },
    400: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
    401: { type: 'object', properties: { error: { type: 'string' } } },
    404: { type: 'object', properties: { error: { type: 'string' } } },
    409: { type: 'object', properties: { error: { type: 'string' } } },
    500: { type: 'object', properties: { error: { type: 'string' } } },
  },
};

export const avatarUploadSchema = {
  tags: ['Profile'],
  summary: 'Upload or update the avatar of the current user',
  headers: {
    type: 'object',
    properties: {
      'x-current-user-id': { type: 'string' },
    },
    required: ['x-current-user-id'],
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
    properties: {
      'x-current-user-id': { type: 'string' },
    },
    required: ['x-current-user-id'],
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

export const getAvatarSchema = {
  tags: ['Profile'],
  summary: 'Fetch user avatar by ID',
  response: {
    200: {
      type: 'object',
      properties: {
        avatar: { type: 'string' } // URL/path to avatar
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
