// schemas/friends.js

export const sendFriendRequestSchema = {
  body: {
    type: 'object',
    required: ['currentUserId'], // temporary until JWT is added
    properties: {
      currentUserId: { type: 'integer', minimum: 1 }
    },
    additionalProperties: false
  },
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', minimum: 1 } // target user ID
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        request: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            senderId: { type: 'integer' },
            receiverId: { type: 'integer' },
            status: { type: 'string' }
          }
        }
      }
    },
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    },
    404: {
      type: 'object',
      properties: {
        error: { type: 'string' }
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

export const acceptFriendRequestSchema = {
  body: {
    type: 'object',
    required: ['currentUserId'],
    properties: {
      currentUserId: { type: 'integer' }
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        request: {
          type: 'object',
          properties: {
            senderId: { type: 'integer' },
            receiverId: { type: 'integer' },
            status: { type: 'string' },
          },
        },
      },
    },
    404: {
      type: 'object',
      properties: { error: { type: 'string' } },
    },
  },
};

export const rejectFriendRequestSchema = {
  body: {
    type: 'object',
    required: ['currentUserId'],
    properties: {
      currentUserId: { type: 'integer' }
    },
  },
  response: {
    200: {
      type: 'object',
      properties: { message: { type: 'string' } },
    },
    404: {
      type: 'object',
      properties: { error: { type: 'string' } },
    },
  },
};

export const removeFriendSchema = {
  body: {
    type: 'object',
    required: ['currentUserId'],
    properties: {
      currentUserId: { type: 'integer' }
    }
  },
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', minimum: 1 } // friend ID
    }
  },
  response: {
    200: {
      type: 'object',
      properties: { message: { type: 'string' } },
    },
    404: {
      type: 'object',
      properties: { error: { type: 'string' } },
    },
  },
};

export const getFriendsSchema = {
  querystring: {
    type: 'object',
    required: ['currentUserId'],
    properties: {
      currentUserId: { type: 'integer' }
    }
  },
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          username: { type: 'string' }
        }
      }
    }
  }
};

export const getIncomingRequestsSchema = {
  querystring: {
    type: 'object',
    required: ['currentUserId'],
    properties: {
      currentUserId: { type: 'integer' }
    }
  },
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          from: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              username: { type: 'string' }
            }
          },
          status: { type: 'string' }
        }
      }
    }
  }
};

export const getOutgoingRequestsSchema = {
  querystring: {
    type: 'object',
    required: ['currentUserId'],
    properties: {
      currentUserId: { type: 'integer' }
    }
  },
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          to: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              username: { type: 'string' }
            }
          },
          status: { type: 'string' }
        }
      }
    }
  }
};
