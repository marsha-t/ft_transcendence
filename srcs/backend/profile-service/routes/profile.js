// routes/profile.js

import prisma from '../prisma/prismaClient.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { getCurrentUserSchema, updateProfileSchema, avatarUploadSchema, removeAvatarSchema, getPlayCountsSchema } from '../schemas/profile.js';

async function profileRoutes(app) {

  // Get current authenticated user's profile
  /*
    Route returns profile information for the currently logged-in user.
    - Fetches user by ID from token
    - Does NOT expose sensitive fields
    - Returns booleans for auth-related state
      - hasPassword: user registered with password
      - isGoogleUser: user registered via Google
  */
  app.get('/profile', { schema: getCurrentUserSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          username: true,
          email: true,
          avatar: true,
          password: true,
          googleId: true
        },
      });

      return reply.send({
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        hasPassword: !!user.password,
        isGoogleUser: !!user.googleId
      });
    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) { return reply.code(err.code).send({ error: err.message }); }
      return reply.code(500).send({ error: 'Failed to fetch user profile' });
    }
  });

  // Update current user's profile information.
  /*
  Allows an authenticated user to update:
  - Username (must be unique)
  - Email (must be unique)
    - Email change is NOT allowed for Google-authenticated users
  - Password
    - Normal users must provide oldPassword + newPassword
    - Google users may set a password for the first time without oldPassword
  */
  app.put('/profile', { schema: updateProfileSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id;
  
      const user = await prisma.user.findUnique({ where: { id: userId } });
  
      const { username: rawUsername, oldPassword, newPassword, newEmail: rawEmail } = request.body;
      const updates = {};

      
      const username = rawUsername?.trim().toLowerCase();
      const newEmail = rawEmail?.trim();
  
      // Updating the username
      if (username && username !== user.username) {
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
          return reply.code(409).send({ message: 'Username already taken' });
        }
        updates.username = username;
      }
  
      // Updating the Email
      if (newEmail && newEmail !== user.email) {
        if (user.googleId) {
          return reply.code(400).send({ message: 'Google users cannot change their email address' });
        }

        const existingEmail = await prisma.user.findUnique({ where: { email: newEmail } });
        if (existingEmail) {
          return reply.code(409).send({ message: 'Email already in use' });
        }
        updates.email = newEmail;
      }

      // Updating the password
      if (newPassword && !oldPassword) {
        // Google user setting a password for the first time
        if (!user.password && user.googleId) {
          const hashedPassword = await bcrypt.hash(newPassword, 12);
          updates.password = hashedPassword;
        } else {
          // Normal users must provide their old password
          return reply.code(400).send({ message: 'Both oldPassword and newPassword are required to change password' });
        }
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
        select: { username: true },
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

  // Update current user's avatar.
  /*
  Allows an authenticated user to update their avatar by:
  - Selecting a preset avatar stored on the server
  - Uploading a custom image file

  Rules:
  - Only image files are allowed (JPG, PNG, GIF, WEBP)
  - Maximum file size is 5MB
  - Old avatars are deleted unless they are the default avatar
  */
  app.put('/profile/avatar', { schema: avatarUploadSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id;

      // 1- Preset avatar selection 
      if (request.body && request.body.presetFilename) {
        const presetFilename = request.body.presetFilename;

        // Validate preset file extension
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

        // Delete old avatar if it exists and it is not the default
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const defaultAvatar = '/uploads/avatars/default.png';
        if (user.avatar && user.avatar !== defaultAvatar) {
          const oldPath = path.join(process.cwd(), user.avatar);
          try {
            await fs.promises.unlink(oldPath);
          } catch (e) {
            request.log.warn(`Failed to delete old avatar: ${oldPath}`);
          }
        }

        // Copy preset avatar and update the database
        await fs.promises.copyFile(presetFullPath, filePath);
        const avatarUrl = `/uploads/avatars/${fileName}`;

        await prisma.user.update({
          where: { id: userId },
          data: { avatar: avatarUrl },
        });

        return reply.code(200).send({ message: 'Preset avatar set successfully', avatar: avatarUrl });
      }

      // 2- File upload avatar
      const data = await request.file().catch(() => null);
      if (!data) return reply.code(400).send({ message: 'No file uploaded or failed parsing' });

      // Validate file extension
      const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const ext = path.extname(data.filename).toLowerCase();
      if (!allowedExts.includes(ext)) {
        return reply.code(400).send({ message: 'Invalid file type. Only JPG, PNG, GIF, or WEBP are allowed.' });
      }

      // Validate MIME type
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimes.includes(data.mimetype)) {
        return reply.code(400).send({ message: 'Invalid MIME type. Must be a JPG, PNG, GIF, or WEBP image.' });
      }

      const buffer = await data.toBuffer();

      // File size limit
      const maxSize = 5 * 1024 * 1024;
      if (buffer.length > maxSize) {
        return reply.code(400).send({ message: 'File too large. Maximum size is 5MB.' });
      }

      const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
      await fs.promises.mkdir(uploadDir, { recursive: true });
      const fileName = `${userId}${ext}`;
      const filePath = path.join(uploadDir, fileName);

      // Delete old avatar if it exists and it is not the default
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const defaultAvatar = '/uploads/avatars/default.png';
      if (user.avatar && user.avatar !== defaultAvatar) {
        const oldPath = path.join(process.cwd(), user.avatar);
        try {
          await fs.promises.unlink(oldPath);
        } catch (e) {
          request.log.warn(`Failed to delete old avatar: ${oldPath}`);
        }
      }

      // Save new avatar and update database
      await fs.promises.writeFile(filePath, buffer);
      const avatarUrl = `/uploads/avatars/${fileName}`;

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

  // Reset current user's avatar to the default image.
  /*
  Allows an authenticated user to remove their custom avatar and reset it to the server default.

  Rules:
  - Deletes the old avatar file unless it is the default avatar.
  - Updates the user's avatar field in the database to the default path.
  */
  app.delete('/profile/avatar', { schema: removeAvatarSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const user = await prisma.user.findUnique({ where: { id: userId } });

      const defaultAvatar = '/uploads/avatars/default.png';

      if (user.avatar && user.avatar !== defaultAvatar) {
        const oldPath = path.join(process.cwd(), user.avatar);
        try {
          await fs.promises.unlink(oldPath);
        } catch (e) {
          request.log.warn(`Failed to delete old avatar: ${oldPath}`);
        }
      }

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