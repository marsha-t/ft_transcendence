// routes/friends.js

import prisma from '../prisma/prismaClient.js';
import { sendFriendRequestSchema, acceptFriendRequestSchema, rejectFriendRequestSchema, removeFriendSchema, getFriendsSchema, getIncomingRequestsSchema, getOutgoingRequestsSchema, searchFriendsSchema } from '../schemas/friends.js';

async function friendsRoutes(app, options) {

  // 1- Send a friend request by username
  app.post('/api/friends/send', { schema: sendFriendRequestSchema }, async (request, reply) => {
    try {
      const { username } = request.body; // target user's username
      // Extract current user ID from header (temporary, JWT will replace)
      const userIdHeader = request.headers['x-current-user-id'];
      const currentUserId = userIdHeader ? Number(userIdHeader) : null;

      // Check if current user exists
      const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } });
      if (!currentUser) return reply.code(404).send({ message: 'Current user not found' });

      // Check if user is trying to add themselves
      if (currentUser.username === username) reply.code(400).send({ message: 'You cannot send a friend request to yourself' });

      // Check if target user exists
      const targetUser = await prisma.user.findUnique({ where: { username } });
      if (!targetUser) return reply.code(404).send({ message: 'User not found' });

      // Check if request already exists (pending or accepted)
      const existing = await prisma.friendRequest.findFirst({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: targetUser.id },
            { senderId: targetUser.id, receiverId: currentUserId }
          ]
        }
      });

      if (existing) return reply.code(409).send({ message: 'Friend request already exists' });

      // Create friend request
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

  // 2- Accept a pending friend request by sender username
  app.put('/api/friends/:username/accept', { schema: acceptFriendRequestSchema }, async (request, reply) => {
    try {
      const { username } = request.params; // sender username
      const userIdHeader = request.headers['x-current-user-id'];
      const currentUserId = userIdHeader ? Number(userIdHeader) : null;

      // Find sender by username
      const sender = await prisma.user.findUnique({ where: { username } });
      if (!sender) return reply.code(404).send({ message: 'Sender not found' });

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

  // 3- Reject a friend request by sender username
  app.put('/api/friends/:username/reject', { schema: rejectFriendRequestSchema }, async (request, reply) => {
    try {
      const { username } = request.params; // sender username
      const userIdHeader = request.headers['x-current-user-id'];
      const currentUserId = userIdHeader ? Number(userIdHeader) : null;

      // Find sender by username
      const sender = await prisma.user.findUnique({ where: { username } });
      if (!sender) return reply.code(404).send({ message: 'Sender not found' });

      // Find pending request
      const requestRecord = await prisma.friendRequest.findFirst({
        where: { senderId: sender.id, receiverId: currentUserId, status: 'PENDING' },
      });
      if (!requestRecord) return reply.code(404).send({ message: 'Pending friend request not found' });

      // Delete request so sender can retry later
      await prisma.friendRequest.delete({ where: { id: requestRecord.id } });

      return reply.code(200).send({ message: 'Friend request rejected' });

    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) return reply.code(err.code).send({ error: err.message });
      return reply.code(500).send({ error: 'Failed to reject friend request' });
    }
  });

  // 4- Remove an existing friend by username
  app.delete('/api/friends/:username', { schema: removeFriendSchema }, async (request, reply) => {
    try {
      const { username } = request.params; // friend's username
      const userIdHeader = request.headers['x-current-user-id'];
      const currentUserId = userIdHeader ? Number(userIdHeader) : null;

      // Find friend by username
      const friend = await prisma.user.findUnique({ where: { username } });
      if (!friend) return reply.code(404).send({ message: 'Friend not found' });

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

  // 5- Get the current user’s list of friends
  app.get('/api/friends', { schema: getFriendsSchema }, async (request, reply) => {
    try {
      const userIdHeader = request.headers['x-current-user-id'];
      const currentUserId = userIdHeader ? Number(userIdHeader) : null;

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

  // 6- Get incoming friend requests (users who added me, still pending)
  app.get('/api/friends/requests', { schema: getIncomingRequestsSchema }, async (request, reply) => {
    try {
      const userIdHeader = request.headers['x-current-user-id'];
      const currentUserId = userIdHeader ? Number(userIdHeader) : null;

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

  // 7- Get outgoing friend requests (users I added, still pending)
  app.get('/api/friends/sent', { schema: getOutgoingRequestsSchema }, async (request, reply) => {
    try {
      const userIdHeader = request.headers['x-current-user-id'];
      const currentUserId = userIdHeader ? Number(userIdHeader) : null;

      const outgoing = await prisma.friendRequest.findMany({
        where: { senderId: currentUserId, status: 'PENDING' },
        include: { receiver: true }
      });

      const requests = outgoing.map(req => ({
        id: req.id,
        to: {
          username: req.receiver.username,
          avatar: req.receiver.avatar,
          status: req.receiver.status
        }
      }));

      return reply.code(200).send(requests);

    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) return reply.code(err.code).send({ error: err.message });
      return reply.code(500).send({ error: 'Failed to fetch outgoing friend requests' });
    }
  });

  // 8- Search users by username (safe + sanitized)
  app.get('/api/friends/search', { schema: searchFriendsSchema }, async (request, reply) => {
    try {
      const { query } = request.query;
      const userIdHeader = request.headers['x-current-user-id'];
      const currentUserId = userIdHeader ? Number(userIdHeader) : null;

      // Basic validation
      if (!query || query.trim() === '') {
        return reply.code(400).send({ error: 'Search query is required' });
      }

      const trimmed = query.trim();

      // Enforce length limit (adjust maxLen as needed)
      const maxLen = 20;
      if (trimmed.length > maxLen) {
        return reply.code(400).send({ error: `Search query must be at most ${maxLen} characters` });
      }

      // Reject if the user deliberately sends only wildcard characters or similar
      // (e.g., "%", "_", "%%", "  %  ")
      // Remove whitespace then check if all remaining chars are only '%' or '_' or backslash
      const noSpace = trimmed.replace(/\s+/g, '');
      if (noSpace.length === 0) {
        return reply.code(400).send({ error: 'Search query is required' });
      }
      if (/^[%_\\]+$/.test(noSpace)) {
        return reply.code(400).send({ error: 'Search query cannot be just wildcard characters' });
      }

      // Escape LIKE wildcards and backslash so the value is treated literally
      // We escape: %, _, and backslash -> prefix with backslash
      const escapeForLike = (s) => s.replace(/[%_\\]/g, '\\$&');

      const escaped = escapeForLike(trimmed);

      // Wrap with % for contains search (safe because escaped)
      const param = `%${escaped}%`;

      // Limit number of results returned
      const limit = 50;

      // Use parameterized $queryRaw to keep it safe. Use ESCAPE '\' so backslash escapes work.
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
        return reply.code(404).send({ error: 'No users found matching your search' });
      }

      return reply.code(200).send(users);

    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to search users' });
    }
  });
}

export default friendsRoutes;