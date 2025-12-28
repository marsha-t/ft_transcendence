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
    try {
      const currentUserId = request.user.id;
      
      const rawUsername = request.body.username;
      const username = rawUsername?.trim().toLowerCase();
      if (!username) {
        return reply.code(400).send({ message: 'Username is required' });
      }

      const targetUser = await prisma.user.findUnique({ where: { username } });
      if (!targetUser) return reply.code(404).send({ message: 'User not found' });

      if (targetUser.id === currentUserId) return reply.code(400).send({ message: 'You cannot send a friend request to yourself' });

      const existing = await prisma.friendRequest.findFirst({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: targetUser.id },
            { senderId: targetUser.id, receiverId: currentUserId }
          ]
        }
      });

      if (existing) return reply.code(409).send({ message: 'Friend request already exists' });

      const requestRecord = await prisma.friendRequest.create({
        data: {
          senderId: currentUserId,
          receiverId: targetUser.id,
          status: 'PENDING'
        }
      });

      return reply.code(201).send({
        message: 'Friend request sent',
        request: {
          id: requestRecord.id,
          senderId: requestRecord.senderId,
          receiverId: requestRecord.receiverId,
          status: requestRecord.status
        }
      });
    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) return reply.code(err.code).send({ error: err.message });
      return reply.code(500).send({ error: 'Failed to send friend request' });
    }
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
    try {
      const currentUserId = request.user.id;

      // Find the sender
      const rawUsername = request.params.username;
      const username = rawUsername?.trim().toLowerCase();
      if (!username) {
        return reply.code(400).send({ message: 'Username is required' });
      }

      const sender = await prisma.user.findUnique({ where: { username } });
      if (!sender) return reply.code(404).send({ message: 'Sender not found' });
      if (sender.id === currentUserId) return reply.code(400).send({ message: 'Invalid operation' });


      // Find pending request
      const requestRecord = await prisma.friendRequest.findFirst({
        where: { senderId: sender.id, receiverId: currentUserId, status: 'PENDING' },
      });
      if (!requestRecord) return reply.code(404).send({ message: 'Pending friend request not found' });

      // Update status to ACCEPTED
      const updated = await prisma.friendRequest.update({
        where: { id: requestRecord.id },
        data: { status: 'ACCEPTED' },
      });

      return reply.code(200).send({
        message: 'Friend request accepted',
        request: {
          senderId: updated.senderId,
          receiverId: updated.receiverId,
          status: updated.status,
        },
      });
    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) return reply.code(err.code).send({ error: err.message });
      return reply.code(500).send({ error: 'Failed to accept friend request' });
    }
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
    try {
      const currentUserId = request.user.id;
      
      // Find the sender
      const rawUsername = request.params.username;
      const username = rawUsername?.trim().toLowerCase();
      if (!username) {
        return reply.code(400).send({ message: 'Username is required' });
      }

      const sender = await prisma.user.findUnique({ where: { username } });
      if (!sender) return reply.code(404).send({ message: 'Sender not found' });
      if (sender.id === currentUserId) return reply.code(400).send({ message: 'Invalid operation' });

      // Find pending request
      const requestRecord = await prisma.friendRequest.findFirst({
        where: { senderId: sender.id, receiverId: currentUserId, status: 'PENDING' },
      });
      if (!requestRecord) return reply.code(404).send({ message: 'Pending friend request not found' });

      // Delete request
      await prisma.friendRequest.delete({ where: { id: requestRecord.id } });

      return reply.code(200).send({ message: 'Friend request rejected' });
    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) return reply.code(err.code).send({ error: err.message });
      return reply.code(500).send({ error: 'Failed to reject friend request' });
    }
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
    try {
      const currentUserId = request.user.id;

      // Find the friend
      const rawUsername = request.params.username;
      const username = rawUsername?.trim().toLowerCase();
      if (!username) {
        return reply.code(400).send({ message: 'Username is required' });
      }

      const friend = await prisma.user.findUnique({ where: { username } });
      if (!friend) return reply.code(404).send({ message: 'Friend not found' });
      if (friend.id === currentUserId) return reply.code(400).send({ message: 'Invalid operation' });

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
      if (!existing) return reply.code(404).send({ message: 'Friendship not found' });

      // Delete the friendship record
      await prisma.friendRequest.delete({ where: { id: existing.id } });

      return reply.code(200).send({ message: 'Friend removed' });
    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) return reply.code(err.code).send({ error: err.message });
      return reply.code(500).send({ error: 'Failed to remove friend' });
    }
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
    try {
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
    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) return reply.code(err.code).send({ error: err.message });
      return reply.code(500).send({ error: 'Failed to fetch friends' });
    }
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
    try {
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
    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) return reply.code(err.code).send({ error: err.message });
      return reply.code(500).send({ error: 'Failed to fetch incoming friend requests' });
    }
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
    try {
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

      // 1. Fetch matching users (excluding current user)
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
  
      // 2. Fetch friends, incoming requests, and outgoing requests
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

      // 3. Filter out friends & incoming requests and mark outgoing requests as pending
      const filteredUsers = userResults
        .filter(u => !friendOtherIds.has(u.id) && !incomingSenderIds.has(u.id))
        .map(u => ({
          id: u.id,
          username: u.username,
          avatar: u.avatar,
          friendStatus: outgoingReceiverIds.has(u.id) ? 'pending_sent' : 'not_friend'
        }));
  
      return reply.code(200).send(filteredUsers);
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to search users' });
    }
  });
}

export default friendsRoutes;