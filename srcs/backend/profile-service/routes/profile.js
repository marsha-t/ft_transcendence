// routes/profile.js

import { getCurrentUserSchema, updateProfileSchema, avatarUploadSchema, removeAvatarSchema } from '../schemas/profile.js';
import prisma from '../prisma/prismaClient.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

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
    const userId = request.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        email: true,
        avatar: true,
        password: true,
        googleId: true,
      },
    });

    return reply.send({
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      hasPassword: !!user.password,
      isGoogleUser: !!user.googleId,
    });
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
        const err = new Error('Username already taken');
        err.statusCode = 409;
        err.code = 'USERNAME_TAKEN';
        throw err;
      }
      updates.username = username;
    }

    // Updating the Email
    if (newEmail && newEmail !== user.email) {
      if (user.googleId) {
        const err = new Error('Google users cannot change their email address');
        err.statusCode = 400;
        err.code = 'GOOGLE_EMAIL_CHANGE_NOT_ALLOWED';
        throw err;
      }

      const existingEmail = await prisma.user.findUnique({ where: { email: newEmail } });
      if (existingEmail) {
        const err = new Error('Email already in use');
        err.statusCode = 409;
        err.code = 'EMAIL_IN_USE';
        throw err;
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
        const err = new Error('Both oldPassword and newPassword are required to change password');
        err.statusCode = 400;
        err.code = 'PASSWORD_CHANGE_INVALID';
        throw err;
      }
    }
    
    if (oldPassword && newPassword) {
      const isValid = await bcrypt.compare(oldPassword, user.password);
      if (!isValid) {
        const err = new Error('Old password is incorrect');
        err.statusCode = 401;
        err.code = 'INVALID_OLD_PASSWORD';
        throw err;
      }
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      updates.password = hashedPassword;
    }

    if (Object.keys(updates).length === 0) {
      const err = new Error('No valid fields to update');
      err.statusCode = 400;
      err.code = 'NO_PROFILE_CHANGES';
      throw err;
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
    const userId = request.user.id;

    // 1) Preset avatar selection 
    if (request.body && request.body.presetFilename) {
      const presetFilename = request.body.presetFilename;

      // Only allow preset avatars from uploads/avatars
      const presetFullPath = path.join(process.cwd(), 'uploads', 'avatars', presetFilename);
      if (!fs.existsSync(presetFullPath)) {
        const err = new Error('Preset avatar not found');
        err.statusCode = 404;
        err.code = 'PRESET_AVATAR_NOT_FOUND';
        throw err;
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
          console.warn(`Failed to delete old avatar: ${oldPath}`);
        }
      }

      // Copy preset avatar and update the database
      try {
        await fs.promises.copyFile(presetFullPath, filePath);

        const avatarUrl = `/uploads/avatars/${fileName}`;
        await prisma.user.update({
          where: { id: userId },
          data: { avatar: avatarUrl },
        });

        return reply.code(200).send({ message: 'Preset avatar set successfully', avatar: avatarUrl });
      } catch (e) {
        const err = new Error('Failed to set preset avatar');
        err.statusCode = 500;
        err.code = 'PRESET_AVATAR_UPDATE_FAILED';
        throw err;
      }
    }

    // 2) File upload avatar
    const data = await request.file().catch(() => null);
    if (!data) {
      const err = new Error('No file uploaded or failed parsing');
      err.statusCode = 400;
      err.code = 'NO_AVATAR_FILE';
      throw err;
    }

    // Validate file extension
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(data.filename).toLowerCase();
    if (!allowedExts.includes(ext)) {
      const err = new Error('Invalid file type');
      err.statusCode = 400;
      err.code = 'INVALID_AVATAR_FILE_TYPE';
      throw err;
    }

    // Validate MIME type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(data.mimetype)) {
      const err = new Error('Invalid MIME type');
      err.statusCode = 400;
      err.code = 'INVALID_AVATAR_MIME_TYPE';
      throw err;
    }

    const buffer = await data.toBuffer();

    // File size limit
    const maxSize = 5 * 1024 * 1024;
    if (buffer.length > maxSize) {
      const err = new Error('File too large');
      err.statusCode = 400;
      err.code = 'AVATAR_FILE_TOO_LARGE';
      throw err;
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
        console.warn(`Failed to delete old avatar: ${oldPath}`);
      }
    }

    // Save new avatar and update database
    try {
      await fs.promises.writeFile(filePath, buffer);

      const avatarUrl = `/uploads/avatars/${fileName}`;
      await prisma.user.update({
        where: { id: userId },
        data: { avatar: avatarUrl },
      });

      return reply.code(200).send({ message: 'Avatar uploaded successfully', avatar: avatarUrl });
    } catch (e) {
      const err = new Error('Failed to upload avatar');
      err.statusCode = 500;
      err.code = 'AVATAR_UPLOAD_FAILED';
      throw err;
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
    const userId = request.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const defaultAvatar = '/uploads/avatars/default.png';

    if (user.avatar && user.avatar !== defaultAvatar) {
      const oldPath = path.join(process.cwd(), user.avatar);
      try {
        await fs.promises.unlink(oldPath);
      } catch (e) {
        console.warn(`Failed to delete old avatar: ${oldPath}`);
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { avatar: defaultAvatar },
    });

    return reply.code(200).send({ message: 'Avatar removed, reset to default', avatar: defaultAvatar });
  });
}

export default profileRoutes;