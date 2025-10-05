// routes/profile.js

import prisma from '../prisma/prismaClient.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { getCurrentUserSchema, updateProfileSchema, avatarUploadSchema, removeAvatarSchema, getAvatarSchema  } from '../schemas/profile.js';

async function profileRoutes(app, options) {

  // 1- Get current user's profile by ID 
  app.get('/api/profile', { schema: getCurrentUserSchema }, async (request, reply) => {
    try {
      // Extract user ID from header (temporary)
      const userIdHeader = request.headers['x-current-user-id'];
      const userId = userIdHeader ? Number(userIdHeader) : null;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          username: true,
          email: true,
          avatar: true,
        },
      });

      if (!user) {
        return reply.code(404).send({ message: 'User not found' });
      }

      return reply.code(200).send(user);

    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) { return reply.code(err.code).send({ error: err.message }); }
      return reply.code(500).send({ error: 'Failed to fetch user profile' });
    }
  });

  app.put('/api/profile', { schema: updateProfileSchema }, async (request, reply) => {
    try {
      const userIdHeader = request.headers['x-current-user-id'];
      const userId = userIdHeader ? Number(userIdHeader) : null;
      if (!userId) return reply.code(400).send({ message: 'Missing user ID' });
  
      // Fetch the user from DB
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return reply.code(404).send({ message: 'User not found' });
  
      const { username, oldPassword, newPassword, newEmail } = request.body;
      const updates = {};
  
      // --- Username ---
      if (username && username !== user.username) {
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) return reply.code(409).send({ message: 'Username already taken' });
        updates.username = username;
      }
  
      // --- Password ---
      if (oldPassword && newPassword) {
        const isValid = await bcrypt.compare(oldPassword, user.password);
        if (!isValid) return reply.code(401).send({ message: 'Old password is incorrect' });
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        updates.password = hashedPassword;
      }
  
      // --- Email ---
      if (newEmail && newEmail !== user.email) {
        const existingEmail = await prisma.user.findUnique({ where: { email: newEmail } });
        if (existingEmail) return reply.code(409).send({ message: 'Email already in use' });
        updates.email = newEmail;
      }
  
      if (Object.keys(updates).length === 0) {
        return reply.code(400).send({ message: 'No valid fields to update' });
      }
  
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updates,
        select: { username: true, email: true },
      });
  
      return reply.code(200).send({
        message: 'Profile updated successfully',
        data: updatedUser,
      });
  
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ message: 'Failed to update profile' });
    }
  });  

  // 3- Update avatar through upload
  app.put('/api/profile/avatar', { schema: avatarUploadSchema }, async (request, reply) => {
    try {
      const userIdHeader = request.headers['x-current-user-id'];
      const userId = userIdHeader ? Number(userIdHeader) : null;

      if (!userId) return reply.code(400).send({ message: 'Missing user ID in header' });

      // Get file
      const data = await request.file().catch(err => {
        console.error('File parsing error:', err);
        return null;
      });

      if (!data) return reply.code(400).send({ message: 'No file uploaded or failed parsing' });

      console.log('Received file:', data.filename, data.mimetype);

      // Validate extension -> only allow well-known image types
      const allowedExts = ['.jpg', '.jpeg', '.png', '.gif'];
      const ext = path.extname(data.filename).toLowerCase();
      if (!allowedExts.includes(ext)) {
        return reply.code(400).send({ message: 'Invalid file type. Only JPG, PNG, or GIF are allowed.' });
      }

      // MIME type check
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedMimes.includes(data.mimetype)) {
        return reply.code(400).send({ message: 'Invalid MIME type. Must be a JPG, PNG, or GIF image.' });
      }

      // Read buffer
      const buffer = await data.toBuffer();

      // File size limit
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (buffer.length > maxSize) {
        return reply.code(400).send({ message: 'File too large. Maximum size is 5MB.' });
      }

      const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
      await fs.promises.mkdir(uploadDir, { recursive: true });

      const fileName = `${userId}${ext}`;
      const filePath = path.join(uploadDir, fileName);

      // Delete old avatar if exists and is not default
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const defaultAvatar = '/uploads/avatars/default.png';
      if (user?.avatar && user.avatar !== defaultAvatar) {
        const oldPath = path.join(process.cwd(), user.avatar);
        try {
          await fs.promises.unlink(oldPath);
        } catch (e) {
          request.log.warn(`Failed to delete old avatar: ${oldPath}`);
        }
      }

      // Save new avatar
      await fs.promises.writeFile(filePath, buffer);
      const avatarUrl = `/uploads/avatars/${fileName}`;

      // Update DB
      await prisma.user.update({
        where: { id: userId },
        data: { avatar: avatarUrl },
      });

      return reply.code(200).send({ message: 'Avatar uploaded successfully', avatar: avatarUrl });

    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ message: 'Failed to upload avatar' });
    }
  });

  // 4- Remove avatar (reset to default)
  app.delete('/api/profile/avatar', { schema: removeAvatarSchema }, async (request, reply) => {
    try {
      const userIdHeader = request.headers['x-current-user-id'];
      const userId = userIdHeader ? Number(userIdHeader) : null;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return reply.code(404).send({ message: 'User not found' });

      const defaultAvatar = '/uploads/avatars/default.png';

      // Delete old avatar file (if not default)
      if (user.avatar && user.avatar !== defaultAvatar) {
        const oldPath = path.join(process.cwd(), user.avatar);
        try {
          await fs.promises.unlink(oldPath);
        } catch (e) {
          request.log.warn(`Failed to delete old avatar: ${oldPath}`);
        }
      }

      // Update DB
      await prisma.user.update({
        where: { id: userId },
        data: { avatar: defaultAvatar },
      });

      return reply.code(200).send({ message: 'Avatar removed, reset to default', avatar: defaultAvatar });

    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) return reply.code(err.code).send({ message: err.message });
      return reply.code(500).send({ message: 'Failed to remove avatar' });
    }
  });

  // 5- Get avatar only (optional helper route)
  app.get('/api/profile/:id/avatar', { schema: getAvatarSchema }, async (request, reply) => {
    try {
      const { id } = request.params;

      const user = await prisma.user.findUnique({
        where: { id: Number(id) },
        select: { avatar: true },
      });

      if (!user) return reply.code(404).send({ message: 'User not found' });

      return reply.code(200).send({ avatar: user.avatar });

    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) { return reply.code(err.code).send({ error: err.message }); }
      return reply.code(500).send({ error: 'Failed to fetch avatar' });
    }
  });
}

export default profileRoutes;

// To test avatar uploads using CURL:
// curl -X PUT http://localhost:5001/api/profile/1/avatar   -F "file=@$(pwd)/uploads/test-avatar.webp"