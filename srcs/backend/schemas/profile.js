// schemas/profile.js

export const changeUsernameSchema = {
  body: {
    type: 'object',
    required: ['username'],
    properties: {
      username: { 
        type: 'string',
        minLength: 3,
        maxLength: 20,
        pattern: '^[a-zA-Z0-9_]+$'
      },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        updatedUsername: {
          type: 'object',
          properties: {
            username: { type: 'string' },
          },
        },
      },
    },
    400: {
      type: 'object',
      properties: { 
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
    409: {
      type: 'object',
      properties: { error: { type: 'string' } },
    },
  },
};

export const changePasswordSchema = {
  body: {
    type: 'object',
    required: ['oldPassword', 'newPassword'],
    properties: {
      oldPassword: { type: 'string', minLength: 1 },
      newPassword: { 
        type: 'string',
        minLength: 12,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\W_]).{12,}$'
      },
    },
  },
  response: {
    200: { type: 'object', properties: { message: { type: 'string' } } },
    400: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
    401: { type: 'object', properties: { error: { type: 'string' } } },
    404: { type: 'object', properties: { error: { type: 'string' } } },
  },
};

export const changeEmailSchema = {
  body: {
    type: 'object',
    required: ['newEmail', 'password'],
    properties: {
      newEmail: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 1 },
    },
  },
  response: {
    200: { type: 'object', properties: { message: { type: 'string' } } },
    400: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
    401: { type: 'object', properties: { error: { type: 'string' } } },
    404: { type: 'object', properties: { error: { type: 'string' } } },
    409: { type: 'object', properties: { error: { type: 'string' } } },
  },
};

export const avatarUploadSchema = {
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
  },
};
