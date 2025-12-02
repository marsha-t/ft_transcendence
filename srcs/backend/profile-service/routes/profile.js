// routes/profile.js

import prisma from '../prisma/prismaClient.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { getCurrentUserSchema, updateProfileSchema, avatarUploadSchema, removeAvatarSchema, getPlayCountsSchema } from '../schemas/profile.js';

async function profileRoutes(app, options) {
  // Get play counts for heatmap (top-level route inside profileRoutes)

  // 1- Get current user's profile by ID 
  app.get('/profile', { schema: getCurrentUserSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id; // <- JWT payload gives user info

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

  // 2- Update username, password, or email of the current user
  app.put('/profile', { schema: updateProfileSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id;
      if (!userId) return reply.code(400).send({ message: 'Missing user ID' });
  
      // Fetch the user from DB
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return reply.code(404).send({ message: 'User not found' });
  
      // Extract & sanitize input
      const { username, oldPassword, newPassword, newEmail } = request.body;

      // Empty object that will collect valid fields to send to the database later
      const updates = {};
  
      // --- Username ---
      if (username && username !== user.username) {
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) return reply.code(409).send({ message: 'Username already taken' });
        updates.username = username;
      }
  
      // --- Email ---
      if (newEmail && newEmail !== user.email) {
        const existingEmail = await prisma.user.findUnique({ where: { email: newEmail } });
        if (existingEmail) return reply.code(409).send({ message: 'Email already in use' });
        updates.email = newEmail;
      }

      // --- Password ---
      if ((oldPassword && !newPassword) || (!oldPassword && newPassword)) {
        reply.code(400).send({ message: 'Both oldPassword and newPassword are required to change password' });
      }
      
      if (oldPassword && newPassword) {
        const isValid = await bcrypt.compare(oldPassword, user.password);
        if (!isValid) return reply.code(401).send({ message: 'Old password is incorrect' });
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        updates.password = hashedPassword;
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
  app.put('/profile/avatar', { schema: avatarUploadSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id;
      if (!userId) return reply.code(400).send({ message: 'Missing user ID in header' });

      // Check for preset avatar selection
      if (request.body && request.body.presetFilename) {
        const presetFilename = request.body.presetFilename;
        const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const ext = path.extname(presetFilename).toLowerCase();
        if (!allowedExts.includes(ext)) {
          return reply.code(400).send({ message: 'Invalid preset file type.' });
        }
        // Only allow preset avatars from uploads/avatars
        const presetFullPath = path.join(process.cwd(), 'uploads', 'avatars', presetFilename);
        if (!fs.existsSync(presetFullPath)) {
          return reply.code(404).send({ message: 'Preset avatar not found.' });
        }
        // Copy preset to uploads/avatars/{userId}.{ext}
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

        // Copy preset file
        await fs.promises.copyFile(presetFullPath, filePath);
        const avatarUrl = `/uploads/avatars/${fileName}`;

        // Update DB
        await prisma.user.update({
          where: { id: userId },
          data: { avatar: avatarUrl },
        });

        return reply.code(200).send({ message: 'Preset avatar set successfully', avatar: avatarUrl });
      }

      // Otherwise, handle file upload as before
      const data = await request.file().catch(err => {
        console.error('File parsing error:', err);
        return null;
      });

      if (!data) return reply.code(400).send({ message: 'No file uploaded or failed parsing' });

      console.log('Received file:', data.filename, data.mimetype);

      // Validate extension -> only allow well-known image types
      const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const ext = path.extname(data.filename).toLowerCase();
      if (!allowedExts.includes(ext)) {
        return reply.code(400).send({ message: 'Invalid file type. Only JPG, PNG, GIF, or WEBP are allowed.' });
      }

      // MIME type check
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimes.includes(data.mimetype)) {
        return reply.code(400).send({ message: 'Invalid MIME type. Must be a JPG, PNG, GIF, or WEBP image.' });
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
  app.delete('/profile/avatar', { schema: removeAvatarSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id;

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
}

export default profileRoutes;