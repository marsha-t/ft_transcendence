// routes/friends.js

import { sendFriendRequestSchema, acceptFriendRequestSchema, rejectFriendRequestSchema, removeFriendSchema, getFriendsSchema, getIncomingRequestsSchema, searchFriendsSchema } from '../schemas/friends.js';
import prisma from '../prisma/prismaClient.js';

async function friendsRoutes(app) {

  // Send a friend request by username.
  /*
  Allows an authenticated user to send a friend request to another user.

  Rules:
  - You cannot send a friend request to yourself
  - The target user must exist
  - A friend request cannot already exist (pending or accepted)
  */
  app.post('/friends/send', { schema: sendFriendRequestSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    const currentUserId = request.user.id;
  
    const rawUsername = request.body.username;
    const username = rawUsername.trim().toLowerCase();

    const targetUser = await prisma.user.findUnique({ where: { username } });
    if (!targetUser) {
      const err = new Error('User not found');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    if (targetUser.id === currentUserId) {
      const err = new Error('You cannot send a friend request to yourself');
      err.statusCode = 400;
      err.code = 'CANNOT_FRIEND_SELF';
      throw err;
    }

    const existing = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: targetUser.id },
          { senderId: targetUser.id, receiverId: currentUserId }
        ]
      }
    });

    if (existing) {
      const err = new Error('Friend request already exists');
      err.statusCode = 409;
      err.code = 'FRIEND_REQUEST_EXISTS';
      throw err;
    }

    const requestRecord = await prisma.friendRequest.create({
      data: {
        senderId: currentUserId,
        receiverId: targetUser.id,
        status: 'PENDING'
      }
    });

    return reply.code(201).send({ message: 'Friend request sent' });
  });

  // Accept a pending friend request by username.
  /*
  Allows an authenticated user to accept a friend request sent to them.

  Rules:
  - The sender is identified by username
  - Only PENDING friend requests can be accepted
  - The current user must be the receiver of the request
  - You cannot accept a friend request from yourself
  */
  app.put('/friends/:username/accept', { schema: acceptFriendRequestSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    const currentUserId = request.user.id;

    // Find the sender
    const rawUsername = request.params.username;
    const username = rawUsername.trim().toLowerCase();

    const sender = await prisma.user.findUnique({ where: { username } });
    if (!sender) {
      const err = new Error('Sender not found');
      err.statusCode = 404;
      err.code = 'SENDER_NOT_FOUND';
      throw err;
    }

    if (sender.id === currentUserId) {
      const err = new Error('Invalid operation');
      err.statusCode = 400;
      err.code = 'INVALID_OPERATION';
      throw err;
    }

    // Find pending request
    const requestRecord = await prisma.friendRequest.findFirst({
      where: { senderId: sender.id, receiverId: currentUserId, status: 'PENDING' },
    });
    
    if (!requestRecord) {
      const err = new Error('Pending friend request not found');
      err.statusCode = 404;
      err.code = 'PENDING_REQUEST_NOT_FOUND';
      throw err;
    }

    // Update status to ACCEPTED
    const updated = await prisma.friendRequest.update({
      where: { id: requestRecord.id },
      data: { status: 'ACCEPTED' },
    });

    return reply.code(200).send({ message: 'Friend request accepted' });
  });

  // Reject a pending friend request by username.
  /*
  Allows an authenticated user to reject a friend request sent to them.

  Rules:
  - The sender is identified by username
  - Only PENDING friend requests can be rejected
  - The current user must be the receiver of the request
  - Rejected requests are deleted so they can be sent again later
  - You cannot reject a friend request from yourself
  */
  app.put('/friends/:username/reject', { schema: rejectFriendRequestSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    const currentUserId = request.user.id;

    // Find the sender
    const rawUsername = request.params.username;
    const username = rawUsername.trim().toLowerCase();

    const sender = await prisma.user.findUnique({ where: { username } });
    if (!sender) {
      const err = new Error('Sender not found');
      err.statusCode = 404;
      err.code = 'SENDER_NOT_FOUND';
      throw err;
    }

    if (sender.id === currentUserId) {
      const err = new Error('Invalid operation');
      err.statusCode = 400;
      err.code = 'INVALID_OPERATION';
      throw err;
    }

    // Find pending request
    const requestRecord = await prisma.friendRequest.findFirst({
      where: { senderId: sender.id, receiverId: currentUserId, status: 'PENDING' },
    });

    if (!requestRecord) {
      const err = new Error('Pending friend request not found');
      err.statusCode = 404;
      err.code = 'PENDING_REQUEST_NOT_FOUND';
      throw err;
    }

    // Delete request
    await prisma.friendRequest.delete({ where: { id: requestRecord.id } });

    return reply.code(200).send({ message: 'Friend request rejected' });
  });

  // Remove an existing friend by username.
  /*
  Allows an authenticated user to remove an existing friend.

  Rules:
  - The friend is identified by username
  - Only ACCEPTED friendships can be removed
  - You cannot remove yourself
  */
  app.delete('/friends/:username', { schema: removeFriendSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    const currentUserId = request.user.id;

    // Find the friend
    const rawUsername = request.params.username;
    const username = rawUsername.trim().toLowerCase();

    const friend = await prisma.user.findUnique({ where: { username } });
    if (!friend) {
      const err = new Error('Friend not found');
      err.statusCode = 404;
      err.code = 'FRIEND_NOT_FOUND';
      throw err;
    }

    if (friend.id === currentUserId) {
      const err = new Error('Invalid operation');
      err.statusCode = 400;
      err.code = 'INVALID_OPERATION';
      throw err;
    }

    // Check if there is an accepted friendship
    const existing = await prisma.friendRequest.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: currentUserId, receiverId: friend.id },
          { senderId: friend.id, receiverId: currentUserId }
        ]
      }
    });

    if (!existing) {
      const err = new Error('Friendship not found');
      err.statusCode = 404;
      err.code = 'FRIENDSHIP_NOT_FOUND';
      throw err;
    }

    // Delete the friendship record
    await prisma.friendRequest.delete({ where: { id: existing.id } });

    return reply.code(200).send({ message: 'Friend removed' });
  });

  // Get the current user's list of friends.
  /*
  Returns a list of users that have an ACCEPTED friendship with the current user.

  Rules:
  - Only friendships with status ACCEPTED are returned
  - Friendships are bidirectional (sender or receiver)
  - The response always returns the "other user"
  - Sensitive user fields are not exposed
  */
  app.get('/friends', { schema: getFriendsSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    const currentUserId = request.user.id;

    const friends = await prisma.friendRequest.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId }
        ]
      },
      include: { sender: true, receiver: true }
    });

    // Transform into a list of the "other user"
    const friendList = friends.map(fr => {
      const friendUser = fr.senderId === currentUserId ? fr.receiver : fr.sender;
      return {
        username: friendUser.username,
        avatar: friendUser.avatar,
        status: friendUser.status
      };
    });

    return reply.code(200).send(friendList);
  });

  // Get incoming friend requests.
  /*
  Returns a list of pending friend requests sent to the current user.

  Rules:
  - Only requests with status PENDING are returned
  - The current user must be the receiver of the request
  - Only basic sender information is exposed
  */
  app.get('/friends/requests', { schema: getIncomingRequestsSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    const currentUserId = request.user.id;

    const incoming = await prisma.friendRequest.findMany({
      where: { receiverId: currentUserId, status: 'PENDING' },
      include: { sender: true }
    });

    const requests = incoming.map(req => ({
      id: req.id,
      from: {
        username: req.sender.username,
        avatar: req.sender.avatar,
        status: req.sender.status
      }
    }));

    return reply.code(200).send(requests);
  });

  // Search users by username (safe + sanitized).
  /*
    Returns only users that match the query and are not already friends or incoming requests.
    
    Rules:
    - Query length is capped to 20 characters.
    - Empty queries, only spaces, or wildcard-only queries return an empty array [].
    - Marks users with outgoing requests as 'pending_sent'.
  */
  app.get('/friends/search', { schema: searchFriendsSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    const currentUserId = request.user.id;

    // Extract and sanatize query
    const { query } = request.query;
    const maxLen = 20;
    
    let trimmed = '';
    if (typeof query === 'string') {
      trimmed = query.trim().slice(0, maxLen);
    }

    // Return an empty array if the query is empty, spaces only, or wildcard-only
    const noSpace = trimmed.replace(/\s+/g, '');
    if (!trimmed || noSpace.length === 0 || /^[%_\\]+$/.test(noSpace)) {
      return reply.code(200).send([]);
    }

    // Escape LIKE wildcards and backslash
    const escapeForLike = (s) => s.replace(/[%_\\]/g, '\\$&');
    const escaped = escapeForLike(trimmed);
    const param = `%${escaped}%`;

    const limit = 50;

    // 1) Fetch matching users (excluding current user)
    const users = await prisma.$queryRaw`
      SELECT id, username, avatar
      FROM "User"
      WHERE LOWER(username) LIKE LOWER(${param}) ESCAPE '\\'
        AND id != ${currentUserId}
      ORDER BY
        CASE
          WHEN LOWER(username) = LOWER(${trimmed}) THEN 1
          WHEN LOWER(username) LIKE LOWER(${trimmed} || '%') THEN 2
          ELSE 3
        END,
        username ASC
      LIMIT ${limit};
    `;

    if (!users || users.length === 0) {
      return reply.code(200).send([]);
    }

    // 2) Fetch friends, incoming requests, and outgoing requests
    const friends = await prisma.friendRequest.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId }
        ]
      },
      select: { senderId: true, receiverId: true }
    });

    const incomingRequests = await prisma.friendRequest.findMany({
      where: { receiverId: currentUserId, status: 'PENDING' },
      select: { senderId: true }
    });

    const outgoingRequests = await prisma.friendRequest.findMany({
      where: { senderId: currentUserId, status: 'PENDING' },
      select: { receiverId: true }
    });

    // Normalize all IDs to numbers and create sets for faster comparisons
    const userResults = users.map(u => ({ ...u, id: Number(u.id) }));
    const friendOtherIds = new Set();
    friends.forEach(f => {
      const s = Number(f.senderId);
      const r = Number(f.receiverId);
      if (s !== currentUserId) friendOtherIds.add(s);
      if (r !== currentUserId) friendOtherIds.add(r);
    });

    const incomingSenderIds = new Set(incomingRequests.map(r => Number(r.senderId)));
    const outgoingReceiverIds = new Set(outgoingRequests.map(r => Number(r.receiverId)));

    // 3) Filter out friends & incoming requests and mark outgoing requests as pending
    const filteredUsers = userResults
      .filter(u => !friendOtherIds.has(u.id) && !incomingSenderIds.has(u.id))
      .map(u => ({
        id: u.id,
        username: u.username,
        avatar: u.avatar,
        friendStatus: outgoingReceiverIds.has(u.id) ? 'pending_sent' : 'not_friend'
      }));

    return reply.code(200).send(filteredUsers);
  });
}

export default friendsRoutes;