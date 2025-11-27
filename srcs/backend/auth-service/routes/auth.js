// routes/auth.js

import { registerSchema, loginSchema, login2FASchema, resendOTPSchema, enable2FASchema, verify2FASchema, status2FASchema, disable2FASchema, logoutSchema } from '../schemas/auth.js';
import prisma from '../prisma/prismaClient.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendEmail } from '../services/emailService.js';

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

      // Find user
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user || !await bcrypt.compare(password, user.password)) {
        return reply.code(401).send({ message: 'Invalid credentials' });
      }

      // If 2FA is enabled
      if (user.twoFactorEnabled) {
        const otpCode = crypto.randomInt(100000, 999999).toString();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min

        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorCode: otpCode, twoFactorExpiry: otpExpiry },
        });

        await sendEmail(user.email, '2FA Verification Code', `Your OTP is: ${otpCode}`);

        // CREATE TEMP 2FA JWT (SHORT-LIVED TOKEN)
        const tempToken = app.jwt.sign(
          { pendingUserId: user.id },
          { expiresIn: '5m' }
        );

        // Store in secure HttpOnly cookie
        reply.setCookie('pending_2fa', tempToken, {
          httpOnly: true,
          secure: false,      // change to true in production
          sameSite: 'strict',
          path: '/',
          maxAge: 5 * 60,
        });

        return reply.code(200).send({
          message: 'Two-Factor Authentication required',
          twoFactorRequired: true
        });
      }

      // If no 2FA, normal login
      await prisma.user.update({ where: { id: user.id }, data: { status: "ONLINE" } });

      const token = app.jwt.sign({ id: user.id }, { expiresIn: '1h' });

      return reply.setCookie('token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60,
      }).code(200).send({ message: 'Login successful' });

    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Login failed' });
    }
  });

  // 2FA verification during login
  app.post('/api/login/2fa', async (request, reply) => {
    try {
      const { code } = request.body;
      if (!code) return reply.code(400).send({ message: "OTP required" });

      // Read temp cookie
      const tempToken = request.cookies.pending_2fa;
      if (!tempToken) return reply.code(401).send({ message: "2FA session expired" });

      // Decode pending user ID
      let payload;
      try {
        payload = app.jwt.verify(tempToken);
      } catch (err) {
        return reply.code(401).send({ message: "Invalid or expired session" });
      }

      const userId = payload.pendingUserId;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return reply.code(404).send({ message: "User not found" });

      if (user.twoFactorCode !== code) {
        return reply.code(401).send({ message: "Invalid OTP" });
      }

      if (new Date() > user.twoFactorExpiry) {
        return reply.code(401).send({ message: "OTP expired" });
      }

      // Clear OTP + set online
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorCode: null,
          twoFactorExpiry: null,
          status: "ONLINE"
        }
      });

      // Issue real session token
      const sessionToken = app.jwt.sign({ id: user.id }, { expiresIn: "1h" });

      // Clear temp cookie
      reply.clearCookie("pending_2fa");

      reply.setCookie("token", sessionToken, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        path: "/",
        maxAge: 3600
      });

      return reply.code(200).send({ message: "Login successful" });

    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: "2FA verification failed" });
    }
  });

  // Resend OTP route
  app.post('/api/login/resend-otp', async (request, reply) => {
    try {
      const tempToken = request.cookies.pending_2fa;
      if (!tempToken) return reply.code(401).send({ message: "2FA session expired" });

      let payload;
      try {
        payload = app.jwt.verify(tempToken);
      } catch {
        return reply.code(401).send({ message: "Invalid 2FA session" });
      }

      const userId = payload.pendingUserId;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return reply.code(404).send({ message: "User not found" });

      if (!user.twoFactorEnabled) {
        return reply.code(400).send({ message: "2FA not enabled" });
      }

      // New OTP
      const otpCode = crypto.randomInt(100000, 999999).toString();
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorCode: otpCode,
          twoFactorExpiry: otpExpiry
        }
      });

      await sendEmail(user.email, "New OTP Code", `Your new OTP is: ${otpCode}`);

      return reply.code(200).send({
        message: "OTP resent",
        twoFactorRequired: true
      });

    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: "Failed to resend OTP" });
    }
  });

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

  // 2FA status route (needed for the settings toggle button)
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
