// routes/auth.js

import { registerSchema, loginSchema, logoutSchema } from '../schemas/auth.js';
import prisma from '../prisma/prismaClient.js';
import bcrypt from 'bcrypt';

async function authRoutes(app, options) {

  // Register route
  app.post('/api/register', { schema: registerSchema }, async (request, reply) => {
    try {
      const { username, email, password } = request.body;

      // Check if username/email already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: username },
            { email: email }
          ]
        }
      });

      if (existingUser) {
        throw { code: 409, message: 'Username or email already exists' };
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Save user to the database
      await prisma.user.create({
        data: {
          username: username,
          email: email,
          password: hashedPassword,
        },
      });

      // Success
      return reply.code(201).send({ message: 'User registered successfully' });

    } catch (err) {
      request.log.error(err);

      if (err.code && err.message) {
        return reply.code(err.code).send({ error: err.message });
      }

      return reply.code(500).send({ error: 'User registration failed' });
    }
  });

  // Login Route
  app.post('/api/login', { schema: loginSchema }, async (request, reply) => {
    try {
      const { username, password } = request.body;

      // Find user in database
      const user = await prisma.user.findUnique({
        where: { username },
      });
      
      if (!user || !await bcrypt.compare(password, user.password)) {
        throw { code: 401, message: 'Invalid credentials' };
      }

      // Update user status to online
      await prisma.user.update({
        where: { id: user.id },
        data: { status: "ONLINE" },
      });

      // Success
      return reply.code(200).send({ message: 'Login successful' });

    } catch (err) {
      request.log.error(err);

      if (err.code && err.message) {
        return reply.code(err.code).send({ error: err.message });
      }

      return reply.code(500).send({ error: 'Login failed' });
    }
  });

  // Logout Route
  app.post('/api/logout', { schema: logoutSchema }, async (request, reply) => {
    try {
      // Get user ID from header
      const userIdHeader = request.headers['x-current-user-id'];
      if (!userIdHeader) throw { code: 400, message: 'x-current-user-id header is required' };
      const userId = Number(userIdHeader);

      // Find user in database
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw { code: 404, message: 'User not found' };
      }

      // Check if user is already offline
      if (user.status === "OFFLINE") {
        throw { code: 400, message: 'User is already offline' };
      }

      // Update user status to offline
      await prisma.user.update({
        where: { id: userId },
        data: { status: "OFFLINE" },
      });

      return reply.code(200).send({ message: 'Logout successful' });
      
    } catch (err) {
      request.log.error(err);

      if (err.code && err.message) {
        throw err;
      }

      throw { code: 500, message: 'Internal server error' };
    }
  });
}

export default authRoutes;