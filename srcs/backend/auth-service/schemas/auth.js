// schemas/auth.js

export const googleLoginSchema = {
  tags: ['Authentication'],
  summary: 'Log in or register a user via Google OAuth',
  body: {
    type: 'object',
    required: ['idToken'],
    properties: {
      idToken: {
        type: 'string',
        minLength: 10, // rough check for token length
        errorMessage: {
          minLength: 'idToken is invalid or too short'
        }
      }
    },
    additionalProperties: false,
    errorMessage: {
      required: {
        idToken: 'idToken is required'
      },
      additionalProperties: 'No extra fields are allowed'
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        twoFactorRequired: { type: 'boolean' },
        }
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
    401: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' }
      }
    },
    500: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
};

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
        message: { type: 'string' },
        twoFactorRequired: { type: 'boolean' } // optional, only if 2FA is enabled
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
      username: {
        type: 'string',
        minLength: 3,
        errorMessage: {
          minLength: 'Username must be at least 3 characters'
        }
      },
      password: {
        type: 'string',
        minLength: 1,
        errorMessage: {
          minLength: 'Password is required'
        }
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        username: { type: 'string'},
        twoFactorRequired: { type: 'boolean' }
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
    401: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

export const login2FASchema = {
  tags: ['Authentication'],
  summary: 'Verify 2FA code during login',
  body: {
    type: 'object',
    required: ['code'],
    properties: {
      code: {
        type: 'string',
        minLength: 6,
        maxLength: 6,
        errorMessage: {
          minLength: 'Code must be 6 digits',
          maxLength: 'Code must be 6 digits',
        },
      },
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
      properties: { message: { type: 'string' } }
    },
    401: {
      type: 'object',
      properties: { message: { type: 'string' } }
    },
    500: {
      type: 'object',
      properties: { error: { type: 'string' } }
    }
  }
};

export const resendOTPSchema = {
  tags: ['Authentication'],
  summary: 'Resend OTP for Two-Factor Authentication',
  body: {
    type: 'object',
    properties: {},
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        twoFactorRequired: { type: 'boolean' }
      }
    },
    400: {
      type: 'object',
      properties: { message: { type: 'string' } }
    },
    404: {
      type: 'object',
      properties: { message: { type: 'string' } }
    },
    500: {
      type: 'object',
      properties: { error: { type: 'string' } }
    }
  }
};

export const enable2FASchema = {
  tags: ['Authentication'],
  summary: 'Enable Two-Factor Authentication (sends OTP via email)',
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    404: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    500: {
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
  },
};

export const verify2FASchema = {
  tags: ['Authentication'],
  summary: 'Verify Two-Factor Authentication code',
  body: {
    type: 'object',
    required: ['code'],
    properties: {
      code: {
        type: 'string',
        minLength: 6,
        maxLength: 6,
        errorMessage: {
          minLength: 'Code must be 6 digits',
          maxLength: 'Code must be 6 digits',
        },
      },
    },
    additionalProperties: false,
    errorMessage: {
      required: {
        code: 'Verification code is required',
      },
      additionalProperties: 'No extra fields are allowed',
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    400: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    401: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    404: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    500: {
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
  },
};

export const status2FASchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' }
      }
    }
  }
};

export const disable2FASchema = {
  tags: ['Authentication'],
  summary: 'Disable Two-Factor Authentication',
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    404: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    500: {
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
  },
};

export const logoutSchema = {
  tags: ['Authentication'],
  summary: 'Log out a user',
  headers: {
    type: 'object',
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
    404: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    },
    500: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};  
