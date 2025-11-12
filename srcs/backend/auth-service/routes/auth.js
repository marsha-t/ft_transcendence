// routes/auth.js

import { registerSchema, loginSchema, logoutSchema } from '../schemas/auth.js';
import prisma from '../prisma/prismaClient.js';
import bcrypt from 'bcrypt';

async function authRoutes(app, options) {

  // Register route
  app.post('/register', { schema: registerSchema }, async (request, reply) => {
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
        return reply.code(409).send({ message: 'Username or email already exists' });
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
      if (err.code && err.message) { return reply.code(err.code).send({ error: err.message }); }
      return reply.code(500).send({ error: 'User registration failed' });
    }
  });

  // Login Route
  app.post('/login', { schema: loginSchema }, async (request, reply) => {
    try {
      const { username, password } = request.body;

      // Find user in database
      const user = await prisma.user.findUnique({
        where: { username },
      });
      
      if (!user || !await bcrypt.compare(password, user.password)) {
        return reply.code(401).send({ message: 'Invalid credentials' });
      }

      // Update user status to online
      await prisma.user.update({
        where: { id: user.id },
        data: { status: "ONLINE" },
      });

      // Generate JWT token --------------------------------
      const token = app.jwt.sign(
        { id: user.id, username: user.username }, // payload
        { expiresIn: '1h' }                     // optional expiration
      );

      // Send token back to frontend --------------------------------
      return reply.setCookie('token', token, {
              httpOnly: true,       // 🚫 not accessible by JavaScript
              secure: true,         // 🔒 only sent over HTTPS
              sameSite: 'strict',   // Prevents CSFR attack
              path: '/',            // 🍪 available to all routes
              maxAge: 60 * 60,      // 1 hour in seconds
            })
            .code(200)
            .send({ message: 'Login successful' });

    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) { return reply.code(err.code).send({ error: err.message }); }
      return reply.code(500).send({ error: 'Login failed' });
    }
  });

  // Logout Route
  app.post('/logout', { schema: logoutSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id;// safely from JWT

      // Find user in database
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return reply.code(404).send({ message: 'User not found' });
      }

      // Check if user is already offline
      if (user.status === "OFFLINE") {
        return reply.code(400).send({ message: 'User is already offline' });
      }

      // Update user status to offline
      await prisma.user.update({
        where: { id: userId },
        data: { status: "OFFLINE" },
      });

      reply.clearCookie('token', {path: '/',});
      return reply.code(200).send({ message: 'Logout successful' });
      
    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) { return reply.code(err.code).send({ error: err.message }); }
      return reply.code(500).send({ error: 'Logout failed' });
    }
  });
  // ✅ Get current user info (username + avatar)
  app.get('/userInfo', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id; // extracted from JWT

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true, avatar: true },
      });

      if (!user) {
        return reply.code(404).send({ message: 'User not found' });
      }

      return reply.code(200).send({
        username: user.username,
        avatar: user.avatar || '../uploads/avatars/default.png',
      });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch user info' });
    }
  });

}

export default authRoutes;
