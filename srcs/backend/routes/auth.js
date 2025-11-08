// routes/auth.js

import { registerSchema, loginSchema, enable2FASchema, verify2FASchema, status2FASchema, disable2FASchema, logoutSchema } from '../schemas/auth.js';
import prisma from '../prisma/prismaClient.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendEmail } from '../services/emailService.js';

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
  app.post('/api/login', { schema: loginSchema }, async (request, reply) => {
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
              secure: false,         // 🔒 only sent over HTTPS
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

  // 2FA --------------------------------------------
  // Route to enable 2FA
  app.post('/api/2fa/enable', { schema: enable2FASchema, preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id; // from JWT
  
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return reply.code(404).send({ message: 'User not found' });

      // Generate OTP and expiry
      const code = crypto.randomInt(100000, 999999).toString();
      const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  
      // Save to DB
      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorCode: code, twoFactorExpiry: expiry },
      });
  
      // Send OTP via email
      await sendEmail(user.email, '2FA Verification Code', `Your verification code is: ${code}`);
  
      reply.send({ message: 'Verification code sent to email' });

    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) { return reply.code(err.code).send({ error: err.message }); }
      return reply.code(500).send({ error: '2FA enable failed' });
    }
  });  

  // Route to verify 2FA
  app.post('/api/2fa/verify', { schema: verify2FASchema, preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { code } = request.body;

      if (!code) return reply.code(400).send({ message: 'Code is required' });

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return reply.code(404).send({ message: 'User not found' });

      // Check if code matches and is not expired
      if (user.twoFactorCode !== code) {
        return reply.code(401).send({ message: 'Invalid verification code' });
      }

      if (new Date() > user.twoFactorExpiry) {
        return reply.code(401).send({ message: 'Verification code expired' });
      }

      // Enable 2FA and clear code
      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true, twoFactorCode: null, twoFactorExpiry: null },
      });

      return reply.send({ message: '2FA verified and enabled successfully' });

    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) { return reply.code(err.code).send({ error: err.message }); }
      return reply.code(500).send({ error: '2FA verification failed' });
    }
  });

  // 2FA status route
  app.get('/api/2fa/status', { schema: status2FASchema, preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return reply.code(404).send({ message: 'User not found' });

      return reply.send({ enabled: !!user.twoFactorEnabled });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch 2FA status' });
    }
  });

  //  Route to disable 2FA
  app.post('/api/2fa/disable', { schema: disable2FASchema, preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return reply.code(404).send({ message: 'User not found' });

      await prisma.user.update({
        where: { id: userId },
        data: { 
          twoFactorEnabled: false,
          twoFactorCode: null,
          twoFactorExpiry: null,
        },
      });

      return reply.send({ message: '2FA disabled successfully' });

    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) { return reply.code(err.code).send({ error: err.message }); }
      return reply.code(500).send({ error: 'Failed to disable 2FA' });
    }
  });
  // ------------------------------------------------

  // Logout Route
  app.post('/api/logout', { schema: logoutSchema, preHandler: [app.authenticate] }, async (request, reply) => {
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

      reply.clearCookie('token', { path: '/' });
      return reply.code(200).send({ message: 'Logout successful' });
      
    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) { return reply.code(err.code).send({ error: err.message }); }
      return reply.code(500).send({ error: 'Logout failed' });
    }
  });
}

export default authRoutes;
