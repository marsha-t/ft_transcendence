// routes/auth.js

import { registerSchema, loginSchema } from '../schemas/auth.js';
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

      if (!user) {
        throw { code: 401, message: 'Invalid username' };
      }

      // Compare entered password with hashed password in DB
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw { code: 401, message: 'Invalid password' };
      }

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
}

export default authRoutes;