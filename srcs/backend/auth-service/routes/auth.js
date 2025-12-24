// routes/auth.js

import { googleLoginSchema, registerSchema, loginSchema, login2FASchema, resendOTPSchema, enable2FASchema, verify2FASchema, status2FASchema, disable2FASchema, logoutSchema } from '../schemas/auth.js';
import prisma from '../prisma/prismaClient.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendEmail } from '../services/emailService.js';
import { verifyGoogleToken } from '../services/verifyGoogleToken.js';

async function authRoutes(app) {
  
  // User registration
  /*
		Route allows a new user to create an account
		- Trims username and email inputs
		- Checks that username or email is not already in use
		- Hashes password before storing
		- Creates user record in database
	*/
  app.post('/register', { schema: registerSchema }, async (request, reply) => {
    try {
      const { username, email, password } = request.body;

      const trimmedUsername = username?.trim().toLowerCase();;
      const trimmedEmail = email?.trim();

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: trimmedUsername },
            { email: trimmedEmail }
          ]
        }
      });

      if (existingUser) {
        return reply.code(409).send({ message: 'Username or email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      await prisma.user.create({
        data: {
          username: trimmedUsername,
          email: trimmedEmail,
          password: hashedPassword,
        },
      });

      return reply.code(201).send({ message: 'User registered successfully' });
    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) { return reply.code(err.code).send({ error: err.message }); }
      return reply.code(500).send({ error: 'User registration failed' });
    }
  });

  // User login
  /*
    Route allows a user to login with username and password.
    - Normalizes and trims username input
    - Verifies password
    - Handles 2FA if enabled
      - Generates OTP, sends email
      - Stores temporary 2FA token in HttpOnly cookie
    - If no 2FA, sets status to ONLINE and issues JWT token in secure HttpOnly cookie
  */
  app.post('/login', { schema: loginSchema }, async (request, reply) => {
    try {
      const username = request.body.username?.trim().toLowerCase();
      const password = request.body.password?.trim();

      const user = await prisma.user.findUnique({ where: { username } });
      if (!user || !await bcrypt.compare(password, user.password)) {
        return reply.code(401).send({ message: 'Invalid credentials' });
      }

      // If 2FA is enabled
      if (user.twoFactorEnabled) {
        const otpCode = crypto.randomInt(100000, 999999).toString();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorCode: otpCode, twoFactorExpiry: otpExpiry },
        });

        await sendEmail(user.email, '2FA Verification Code', `Your OTP is: ${otpCode}`);

        const tempToken = app.jwt.sign(
          { pendingUserId: user.id },
          { expiresIn: '5m' }
        );

        reply.setCookie('pending_2fa', tempToken, {
          httpOnly: true,
          secure: true,  
          sameSite: 'Lax',
          path: '/',
          maxAge: 5 * 60,
        });

        return reply.code(200).send({
          message: 'Two-Factor Authentication required',
          twoFactorRequired: true
        });
      }

      // If 2FA is disabled
      await prisma.user.update({ where: { id: user.id }, data: { status: "ONLINE" } });

      const token = app.jwt.sign({ id: user.id }, { expiresIn: '1h' });

      return reply.setCookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        path: '/',
        maxAge: 60 * 60,
      }).code(200).send({ message: 'Login successful' });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Login failed' });
    }
  });

  // Google login
  /*
    Route allows a user to login or register via Google OAuth.
    - Verifies the Google ID token
    - Finds existing user by googleId or email
    - Links googleId to existing account if email matches
    - Creates a new user if none exists
      - Generates a normalized, unique username
      - Sets default avatar if none provided
    - Sets user status to ONLINE
    - Issues JWT token in secure HttpOnly cookie
  */
  app.post('/google', { schema: googleLoginSchema}, async (request, reply) => {
    try {
      const { idToken } = request.body;
      if (!idToken) return reply.code(400).send({ message: 'Missing idToken' });
  
      const payload = await verifyGoogleToken(idToken);
      if (!payload) return reply.code(401).send({ message: 'Invalid Google token' });
  
      const { sub: googleId, email, name, picture } = payload;
  
      // 1) Try to find if the user exists by googleId
      let user = await prisma.user.findUnique({ where: { googleId } });
  
      // 2) If not found, try to find the user by email
      if (!user && email) {
        user = await prisma.user.findUnique({ where: { email } });
        if (user) {
          // If user is found, we will link googleId to existing account to avoid duplicate users.
          await prisma.user.update({
            where: { id: user.id },
            data: { googleId },
          });
        }
      }
  
      // 3) If still not found, create a new user
      if (!user) {
        let baseUsername = name
          ? name.replace(/[^a-zA-Z0-9_]/g, '_') // replace invalid chars with underscore
                 .replace(/_+/g, '_')           // collapse multiple underscores
                 .toLowerCase()
          : email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      
        baseUsername = baseUsername.substring(0, 20);
      
        if (baseUsername.length < 3) {
          baseUsername = baseUsername.padEnd(3, '_');
        }
      
        let username = baseUsername;
      
        // Ensure that the new username is unique
        let i = 0;
        while (await prisma.user.findUnique({ where: { username } })) {
          i += 1;
          const suffix = i.toString();
          username = baseUsername.substring(0, 20 - suffix.length) + suffix;
        }
      
        user = await prisma.user.create({
          data: {
            username,
            email,
            googleId,
            avatar: picture || "/uploads/avatars/default.png",
            password: null,
            status: 'ONLINE',
          },
        });
      }
  
      // 4) Set user as online and issue session token
      if (user.status !== 'ONLINE') {
        await prisma.user.update({
          where: { id: user.id },
          data: { status: 'ONLINE' },
        });
      }

      const token = app.jwt.sign({ id: user.id }, { expiresIn: '1h' });
  
      reply.setCookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        path: '/',
        maxAge: 60 * 60,
      });
  
      return reply.code(200).send({ message: 'Login successful', twoFactorRequired: false });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Google login failed' });
    }
  });

  // 2FA verification during login
  /*
    Route verifies a user's 2FA code during login.
    - Reads OTP code from request body
    - Validates pending_2fa cookie and extracts pendingUserId
    - Checks OTP correctness and expiry
    - Clears OTP and sets user status to ONLINE
    - Issues full JWT token in secure HttpOnly cookie
    - Clears temporary 2FA cookie
  */
  app.post('/login/2fa', { schema: login2FASchema }, async (request, reply) => {
    try {
      const code = request.body.code?.trim();
      if (!code) return reply.code(400).send({ message: "OTP required" });

      const tempToken = request.cookies.pending_2fa;
      if (!tempToken) return reply.code(401).send({ message: "2FA session expired" });

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

      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorCode: null,
          twoFactorExpiry: null,
          status: "ONLINE"
        }
      });

      // Clear the temp cookie
      reply.clearCookie("pending_2fa");

      // Issue the real session token
      const sessionToken = app.jwt.sign({ id: user.id }, { expiresIn: "1h" });

      reply.setCookie("token", sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        path: "/",
        maxAge: 60 * 60
      });

      return reply.code(200).send({ message: "Login successful" });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: "2FA verification failed" });
    }
  });

  // Resend OTP during 2FA login
  /*
    Route resends a new OTP for pending 2FA login.
    - Validates pending_2fa cookie
    - Generates new OTP and expiry
    - Updates OTP info in database
    - Sends OTP via email
  */
  app.post('/login/resend-otp', { schema: resendOTPSchema }, async (request, reply) => {
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
      if (!user.twoFactorEnabled) return reply.code(400).send({ message: "2FA not enabled" });

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

  // Get current 2FA status
  /*
    Route returns whether 2FA is enabled for authenticated user.
  */
  app.get('/2fa/status', { schema: status2FASchema, preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const user = await prisma.user.findUnique({ where: { id: userId } });

      return reply.send({ enabled: !!user.twoFactorEnabled });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch 2FA status' });
    }
  });

  // Enable 2FA for user
  /*
    Route generates OTP and expiry, saves to user, sends OTP via email.
  */
  app.post('/2fa/enable', { schema: enable2FASchema, preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id;
  
      const user = await prisma.user.findUnique({ where: { id: userId } });

      const code = crypto.randomInt(100000, 999999).toString();
      const expiry = new Date(Date.now() + 5 * 60 * 1000);
  
      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorCode: code, twoFactorExpiry: expiry },
      });
  
      await sendEmail(user.email, '2FA Verification Code', `Your verification code is: ${code}`);
  
      reply.send({ message: 'Verification code sent to email' });
    } catch (err) {
      request.log.error(err);
      if (err.code && err.message) { return reply.code(err.code).send({ error: err.message }); }
      return reply.code(500).send({ error: '2FA enable failed' });
    }
  });

  // Verify 2FA during enable
  /*
    Route verifies OTP code for enabling 2FA.
    - Checks code match and expiry
    - Enables 2FA and clears OTP from DB
  */
  app.post('/2fa/verify', { schema: verify2FASchema, preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const code = request.body.code?.trim();
      if (!code) return reply.code(400).send({ message: 'Code is required' });

      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (user.twoFactorCode !== code) {
        return reply.code(401).send({ message: 'Invalid verification code' });
      }

      if (new Date() > user.twoFactorExpiry) {
        return reply.code(401).send({ message: 'Verification code expired' });
      }

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

  // Disable 2FA
  /*
    Route disables 2FA for authenticated user and clears any OTP.
  */
  app.post('/2fa/disable', { schema: disable2FASchema, preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id;

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

  // Logout user
  /*
    Route logs out authenticated user.
    - Sets status to OFFLINE
    - Clears JWT cookie
  */
  app.post('/logout', { schema: logoutSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (user.status === "OFFLINE") { 
        return reply.code(400).send({ message: 'User is already offline' }); 
      } 
      
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

  // Check login status
  /*
    Route returns whether the client has a valid JWT token and is logged in.
  */
  app.get("/loginStatus", async (request, reply) => {
    try {
      const token = request.cookies.token;
      if (!token) {
        return reply.code(200).send({ loggedIn: false });
      }

      let payload;
      try { payload = app.jwt.verify(token); } catch { return reply.code(200).send({ loggedIn: false }); }

      const userId = payload.id;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return reply.code(200).send({ loggedIn: false });

      return reply.code(200).send({ loggedIn: true });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to check login status' });
    }
  })
  
  // Get authenticated user info
  /*
    Route returns username and avatar of authenticated user.
  */
  app.get('/userInfo', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true, avatar: true },
      });

      return reply.code(200).send({
        username: user.username,
        avatar: user.avatar,
      });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch user info' });
    }
  });
}

export default authRoutes;
