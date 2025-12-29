// schemas/friends.js

export const sendFriendRequestSchema = {
  tags: ['Friends'],
  summary: 'Send a friend request to another user by username',
  headers: {
    type: 'object',
  },
  body: {
    type: 'object',
    required: ['username'],
    properties: { username: { type: 'string', minLength: 3, maxLength: 20 } },
    additionalProperties: false
  },
  response: {
    200: { type: 'object', properties: { message: { type: 'string' } } }
  }
};

export const acceptFriendRequestSchema = {
  tags: ['Friends'],
  summary: 'Accept a pending friend request',
  headers: {
    type: 'object',
  },
  params: {
    type: 'object',
    required: ['username'],
    properties: {
      username: { type: 'string', minLength: 3, maxLength: 20 }
    },
    additionalProperties: false
  },
  response: {
    200: { type: 'object', properties: { message: { type: 'string' } } }
  }
};

export const rejectFriendRequestSchema = {
  tags: ['Friends'],
  summary: 'Reject a pending friend request',
  headers: {
    type: 'object',
  },
  params: {
    type: 'object',
    required: ['username'],
    properties: {
      username: { type: 'string', minLength: 3, maxLength: 20 }
    },
    additionalProperties: false
  },
  response: {
    200: { type: 'object', properties: { message: { type: 'string' } } }
  }
};

export const removeFriendSchema = {
  tags: ['Friends'],
  summary: 'Remove an existing friend (unfriend)',
  headers: {
    type: 'object',
  },
  params: {
    type: 'object',
    required: ['username'],
    properties: {
      username: { type: 'string', minLength: 3, maxLength: 20 }
    },
    additionalProperties: false
  },
  response: {
    200: { type: 'object', properties: { message: { type: 'string' } } }
  }
};

export const getFriendsSchema = {
  tags: ['Friends'],
  summary: 'Get the list of all accepted friends of the current user',
  headers: {
    type: 'object',
  },
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          username: { type: 'string' },
          avatar: { type: 'string' },
          status: { type: 'string' }
        }
      }
    }
  }
};

export const getIncomingRequestsSchema = {
  tags: ['Friends'],
  summary: 'Get incoming friend requests (users who added me, still pending)',
  headers: {
    type: 'object',
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
              username: { type: 'string' },
              avatar: { type: 'string' },
              status: { type: 'string' }
            } 
          },
          status: { type: 'string' }
        }
      }
    }
  }
};

export const searchFriendsSchema = {
  tags: ['Friends'],
  summary: 'Search for users by username',
  headers: {
    type: 'object',
  },
  querystring: {
    type: 'object',
    required: ['query'],
    properties: { query: { type: 'string', minLength: 1 } },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'array',
      items: { 
        type: 'object', 
        properties: { 
          id: { type: 'integer' }, 
          username: { type: 'string' }, 
          avatar: { type: 'string' },
          friendStatus: { type: 'string', enum: ['not_friend', 'pending_sent'] }
        } 
      }
    }
  }
};
