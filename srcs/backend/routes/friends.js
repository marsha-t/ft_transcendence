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
}

export default friendsRoutes;