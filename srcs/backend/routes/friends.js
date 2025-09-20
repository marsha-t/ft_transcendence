// routes/friends.js

import prisma from '../prisma/prismaClient.js';
import { sendFriendRequestSchema, acceptFriendRequestSchema, rejectFriendRequestSchema, removeFriendSchema, getFriendsSchema, getIncomingRequestsSchema, getOutgoingRequestsSchema, searchFriendsSchema } from '../schemas/friends.js';

async function friendsRoutes(app, options) {

  // 1- Send a friend request by username
  app.post('/api/friends/send', { schema: sendFriendRequestSchema }, async (request, reply) => {
    try {
      const { username } = request.body;       // target user's username
      const { currentUserId } = request.body;  // temporary: sender ID

      // Check if user is trying to add themselves
      const currentUser = await prisma.user.findUnique({ where: { id: Number(currentUserId) } });
      if (!currentUser) {
        throw { code: 404, message: 'Current user not found' };
      }
      if (currentUser.username === username) {
        throw { code: 400, message: 'You cannot send a friend request to yourself' };
      }

      // Check if target user exists
      const targetUser = await prisma.user.findUnique({ where: { username } });
      if (!targetUser) {
        throw { code: 404, message: 'User not found' };
      }

      // Check if request already exists (pending or accepted)
      const existing = await prisma.friendRequest.findFirst({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: targetUser.id },
            { senderId: targetUser.id, receiverId: currentUserId }
          ]
        }
      });

      if (existing) {
        throw { code: 409, message: 'Friend request already exists' };
      }

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
      if (err.code && err.message) {
        return reply.code(err.code).send({ error: err.message });
      }
      return reply.code(500).send({ error: 'Failed to send friend request' });
    }
  });

  // 2- Accept a pending friend request
  app.put('/api/friends/:id/accept', { schema: acceptFriendRequestSchema }, async (request, reply) => {
    try {
      const { id } = request.params;           // sender ID of the request
      const { currentUserId } = request.body;  // temporary: receiver ID (you)

      // Find pending request
      const requestRecord = await prisma.friendRequest.findFirst({
        where: { senderId: Number(id), receiverId: currentUserId, status: 'PENDING' },
      });

      if (!requestRecord) {
        throw { code: 404, message: 'Pending friend request not found' };
      }

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
      if (err.code && err.message) {
        return reply.code(err.code).send({ error: err.message });
      }
      return reply.code(500).send({ error: 'Failed to accept friend request' });
    }
  });

  // 3- Reject a friend request
  app.put('/api/friends/:id/reject', { schema: rejectFriendRequestSchema }, async (request, reply) => {
    try {
      const { id } = request.params;           // sender ID of the request
      const { currentUserId } = request.body;  // temporary: receiver ID (you)

      // Find pending request
      const requestRecord = await prisma.friendRequest.findFirst({
        where: { senderId: Number(id), receiverId: currentUserId, status: 'PENDING' },
      });

      if (!requestRecord) {
        throw { code: 404, message: 'Pending friend request not found' };
      }

      // Delete the request so sender can retry later
      await prisma.friendRequest.delete({ where: { id: requestRecord.id } });

      return reply.code(200).send({ message: 'Friend request rejected' });

    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) {
        return reply.code(err.code).send({ error: err.message });
      }
      return reply.code(500).send({ error: 'Failed to reject friend request' });
    }
  });

  // 4- Remove an existing friend
  app.delete('/api/friends/:id', { schema: removeFriendSchema }, async (request, reply) => {
    try {
      const { id } = request.params;           // friend user ID
      const { currentUserId } = request.body;  // temporary: current user

      // Check if there is an accepted friendship
      const existing = await prisma.friendRequest.findFirst({
        where: {
          status: 'ACCEPTED',
          OR: [
            { senderId: currentUserId, receiverId: Number(id) },
            { senderId: Number(id), receiverId: currentUserId }
          ]
        }
      });

      if (!existing) {
        throw { code: 404, message: 'Friendship not found' };
      }

      // Delete the friendship record
      await prisma.friendRequest.delete({
        where: { id: existing.id }
      });

      return reply.code(200).send({ message: 'Friend removed' });

    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) {
        return reply.code(err.code).send({ error: err.message });
      }
      return reply.code(500).send({ error: 'Failed to remove friend' });
    }
  });

  // 5- Get the current user’s list of friends
  app.get('/api/friends', { schema: getFriendsSchema }, async (request, reply) => {
    try {
      const { currentUserId } = request.query;

      const friends = await prisma.friendRequest.findMany({
        where: {
          status: 'ACCEPTED',
          OR: [
            { senderId: currentUserId },
            { receiverId: currentUserId }
          ]
        },
        include: {
          sender: true,
          receiver: true
        }
      });

      // Transform into a list of the "other user"
      const friendList = friends.map(fr => {
        const friendUser = fr.senderId === currentUserId ? fr.receiver : fr.sender;
        return { id: friendUser.id, username: friendUser.username };
      });

      return reply.code(200).send(friendList);

    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch friends' });
    }
  });

  // 6- Get incoming friend requests (users who added me, still pending)
  app.get('/api/friends/requests', { schema: getIncomingRequestsSchema }, async (request, reply) => {
    try {
      const { currentUserId } = request.query;

      const incoming = await prisma.friendRequest.findMany({
        where: {
          receiverId: currentUserId,
          status: 'PENDING'
        },
        include: {
          sender: true
        }
      });

      const requests = incoming.map(req => ({
        id: req.id,
        from: { id: req.sender.id, username: req.sender.username },
        status: req.status
      }));

      return reply.code(200).send(requests);

    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch incoming friend requests' });
    }
  });

  // 7- Get outgoing friend requests (users I added, still pending)
  app.get('/api/friends/sent', { schema: getOutgoingRequestsSchema }, async (request, reply) => {
    try {
      const { currentUserId } = request.query;

      const outgoing = await prisma.friendRequest.findMany({
        where: {
          senderId: currentUserId,
          status: 'PENDING'
        },
        include: {
          receiver: true
        }
      });

      const requests = outgoing.map(req => ({
        id: req.id,
        to: { id: req.receiver.id, username: req.receiver.username },
        status: req.status
      }));

      return reply.code(200).send(requests);

    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch outgoing friend requests' });
    }
  });

  // 8- Search users by username
  app.get('/api/friends/search', { schema: searchFriendsSchema }, async (request, reply) => {
    try {
      const { query, currentUserId } = request.query; // search term and your user ID

      if (!query || query.trim() === '') {
        throw { code: 400, message: 'Search query is required' };
      }

      // Find users whose username contains the search query (case-insensitive as Prisma 6 .contain is "sensitive")
      // Sort it exact matches first, then usernames starting with the query, then any other partial match in ascending order
      const users = await prisma.$queryRaw`
        SELECT id, username, avatar
        FROM User
        WHERE LOWER(username) LIKE LOWER(${`%${query}%`})
          AND id != ${currentUserId}
        ORDER BY
          CASE
            WHEN LOWER(username) = LOWER(${query}) THEN 1
            WHEN LOWER(username) LIKE LOWER(${query} || '%') THEN 2
            ELSE 3
          END,
          username ASC;
      `;

      if (users.length === 0) {
      throw { code: 404, message: 'No users found matching your search' };
    }

      return reply.code(200).send(users);
    } catch (err) {
      request.log.error(err);

      if (err.code && err.message) {
        throw err;
      }

      throw { code: 500, message: 'Failed to search users' };
    }
  });
}

export default friendsRoutes;