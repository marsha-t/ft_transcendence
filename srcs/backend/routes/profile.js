// routes/profile.js

import prisma from '../prisma/prismaClient.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { getCurrentUserSchema, changeUsernameSchema, changePasswordSchema, changeEmailSchema, avatarUploadSchema, removeAvatarSchema, getAvatarSchema  } from '../schemas/profile.js';

async function profileRoutes(app, options) {

  // 1- Get current user's profile by ID (temporary: expects userId in body)
  app.get('/api/profile', { schema: getCurrentUserSchema }, async (request, reply) => {
    try {
      // Extract user ID from header (temporary)
      const userIdHeader = request.headers['x-current-user-id'];
      const userId = userIdHeader ? Number(userIdHeader) : null;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          username: true,
          avatar: true,
        },
      });

      if (!user) {
        throw { code: 404, message: 'User not found' };
      }

      return reply.code(200).send(user);

    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) {
        return reply.code(err.code).send({ error: err.message });
      }
      return reply.code(500).send({ error: 'Failed to fetch user profile' });
    }
  });

  // 2- Update username (temporary: expects userId in URL)
  app.put('/api/profile/:id/username', { schema: changeUsernameSchema }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { username } = request.body;

      // Check if username already exists
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser) {
        throw { code: 409, message: 'Username already taken' };
      }

      const updatedUsername = await prisma.user.update({
        where: { id: Number(id) },
        data: { username },
        select: { username: true },
      });

      return reply.code(200).send({ message: 'Username updated successfully', updatedUsername });

    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) {
        return reply.code(err.code).send({ error: err.message });
      }
      return reply.code(500).send({ error: 'Failed to update username' });
    }
  });

  // 3- Update password (temporary: expects userId in URL)
  app.put('/api/profile/:id/password', { schema: changePasswordSchema }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { oldPassword, newPassword } = request.body;

      const user = await prisma.user.findUnique({ where: { id: Number(id) } });
      if (!user) throw { code: 404, message: 'User not found' };

      const isValid = await bcrypt.compare(oldPassword, user.password);
      if (!isValid) throw { code: 401, message: 'Old password is incorrect' };

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({ where: { id: Number(id) }, data: { password: hashedPassword } });

      return reply.code(200).send({ message: 'Password updated successfully' });

    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) {
        return reply.code(err.code).send({ error: err.message });
      }
      return reply.code(500).send({ error: 'Failed to update password' });
    }
  });

  // 4- Update email (temporary: expects userId in URL)
  app.put('/api/profile/:id/email', { schema: changeEmailSchema }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { newEmail, password } = request.body;

      // Find the user by ID
      const user = await prisma.user.findUnique({ where: { id: Number(id) } });
      if (!user) throw { code: 404, message: 'User not found' };

      // Verify the password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) throw { code: 401, message: 'Incorrect password' };

      // Check if the new email is already in use
      const existingUser = await prisma.user.findUnique({ where: { email: newEmail } });
      if (existingUser) throw { code: 409, message: 'Email already in use' };

      // Update the email
      await prisma.user.update({
        where: { id: Number(id) },
        data: { email: newEmail },
      });

      return reply.code(200).send({ message: 'Email updated successfully' });

    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) {
        return reply.code(err.code).send({ error: err.message });
      }
      return reply.code(500).send({ error: 'Failed to update email' });
    }
  });

  // 5- Update avatar through upload (temporary: expects userId in URL)
  app.put('/api/profile/:id/avatar', { schema: avatarUploadSchema }, async (request, reply) => {
    try {
      const { id } = request.params;
      const data = await request.file();

      if (!data) throw { code: 400, message: 'No file uploaded' };

      // Save file as <userId>.ext
      const ext = path.extname(data.filename) || '.jpg';
      const fileName = `${id}${ext}`;
      const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
      const filePath = path.join(uploadDir, fileName);

      const buffer = await data.toBuffer();
      await fs.promises.writeFile(filePath, buffer);

      const avatarUrl = `/uploads/avatars/${fileName}`;

      await prisma.user.update({
        where: { id: Number(id) },
        data: { avatar: avatarUrl },
      });

      return reply.code(200).send({ message: 'Avatar uploaded successfully', avatar: avatarUrl });

    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) {
        return reply.code(err.code).send({ error: err.message });
      }
      return reply.code(500).send({ error: 'Failed to upload avatar' });
    }
  });

  // 6- Remove avatar (reset to default)
  app.delete('/api/profile/:id/avatar', { schema: removeAvatarSchema }, async (request, reply) => {
    try {
      const { id } = request.params;

      // Find the user
      const user = await prisma.user.findUnique({ where: { id: Number(id) } });
      if (!user) throw { code: 404, message: 'User not found' };

      // Define default avatar (served from uploads folder)
      const defaultAvatar = '/uploads/avatars/default.png';

      // Update DB with default avatar
      await prisma.user.update({
        where: { id: Number(id) },
        data: { avatar: defaultAvatar },
      });

      return reply.code(200).send({ message: 'Avatar removed, reset to default', avatar: defaultAvatar });

    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) {
        return reply.code(err.code).send({ error: err.message });
      }
      return reply.code(500).send({ error: 'Failed to remove avatar' });
    }
  });

  // 7- Get avatar only (optional helper route)
  app.get('/api/profile/:id/avatar', { schema: getAvatarSchema }, async (request, reply) => {
    try {
      const { id } = request.params;

      // Find the user
      const user = await prisma.user.findUnique({
        where: { id: Number(id) },
        select: { avatar: true },
      });

      if (!user) throw { code: 404, message: 'User not found' };

      return reply.code(200).send({ avatar: user.avatar });

    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) {
        return reply.code(err.code).send({ error: err.message });
      }
      return reply.code(500).send({ error: 'Failed to fetch avatar' });
    }
  });
}

export default profileRoutes;

// To test avatar uploads using CURL:
// curl -X PUT http://localhost:5001/api/profile/2/avatar   -F "file=@$(pwd)/uploads/test-avatar.webp"