// routes/auth.js

import { registerSchema, loginSchema, googleLoginSchema, login2FASchema, resendOTPSchema, status2FASchema, enable2FASchema, verify2FASchema, disable2FASchema, logoutSchema, loginStatusSchema } from '../schemas/auth.js';
import { sendEmail } from '../services/emailService.js';
import { verifyGoogleToken } from '../services/verifyGoogleToken.js';
import prisma from '../prisma/prismaClient.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

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
    const { username, email, password } = request.body;

    const trimmedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim();

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: trimmedUsername },
          { email: trimmedEmail },
        ],
      },
    });

    if (existingUser) {
      const err = new Error('Username or email already exists');
      err.statusCode = 409;
      err.code = 'USER_ALREADY_EXISTS';
      throw err;
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
    const username = request.body.username.trim().toLowerCase();
    const password = request.body.password.trim();

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !await bcrypt.compare(password, user.password)) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
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
        twoFactorRequired: true,
      });
    }

    // If 2FA is disabled
    await prisma.user.update({ where: { id: user.id }, data: { status: 'ONLINE' } });

    const token = app.jwt.sign({ id: user.id }, { expiresIn: '1h' });

    reply.setCookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: 60 * 60,
    });

    return reply.code(200).send({ message: 'Login successful', twoFactorRequired: false });
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
    const { idToken } = request.body;
    if (!idToken) {
      const err = new Error('Missing idToken');
      err.statusCode = 400;
      err.code = 'MISSING_IDTOKEN';
      throw err;
    }

    const payload = await verifyGoogleToken(idToken);
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
    const code = request.body.code.trim();

    const tempToken = request.cookies.pending_2fa;
    if (!tempToken) {
      const err = new Error('2FA session expired');
      err.statusCode = 401;
      err.code = 'SESSION_EXPIRED';
      throw err;
    }

    let payload;
    try {
      payload = app.jwt.verify(tempToken);
    } catch {
      const err = new Error('Invalid or expired session');
      err.statusCode = 401;
      err.code = 'INVALID_SESSION';
      throw err;
    }

    const userId = payload.pendingUserId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    if (user.twoFactorCode !== code) {
      const err = new Error('Invalid OTP');
      err.statusCode = 401;
      err.code = 'INVALID_OTP';
      throw err;
    }

    if (new Date() > user.twoFactorExpiry) {
      const err = new Error('OTP expired');
      err.statusCode = 401;
      err.code = 'OTP_EXPIRED';
      throw err;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorCode: null, twoFactorExpiry: null, status: 'ONLINE' },
    });

    // Clear the temp cookie
    reply.clearCookie('pending_2fa');

    // Issue the real session token
    const sessionToken = app.jwt.sign({ id: user.id }, { expiresIn: '1h' });
    
    reply.setCookie('token', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: 60 * 60,
    });

    return reply.code(200).send({ message: 'Login successful' });
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
    const tempToken = request.cookies.pending_2fa;
    if (!tempToken) {
      const err = new Error('2FA session expired');
      err.statusCode = 401;
      err.code = 'SESSION_EXPIRED';
      throw err;
    }

    let payload;
    try {
      payload = app.jwt.verify(tempToken);
    } catch {
      const err = new Error('Invalid 2FA session');
      err.statusCode = 401;
      err.code = 'INVALID_SESSION';
      throw err;
    }

    const userId = payload.pendingUserId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    if (!user.twoFactorEnabled) {
      const err = new Error('2FA not enabled');
      err.statusCode = 400;
      err.code = 'TWOFA_NOT_ENABLED';
      throw err;
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorCode: otpCode,
        twoFactorExpiry: otpExpiry,
      },
    });

    await sendEmail(user.email, 'New OTP Code', `Your new OTP is: ${otpCode}`);

    return reply.code(200).send({
      message: 'OTP resent',
      twoFactorRequired: true,
    });
  });

  // Get current 2FA status
  /*
    Route returns whether 2FA is enabled for authenticated user.
  */
  app.get('/2fa/status', { schema: status2FASchema, preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    return reply.send({ enabled: !!user.twoFactorEnabled });
  });

  // Enable 2FA for user
  /*
    Route generates OTP and expiry, saves to user, sends OTP via email.
  */
  app.post('/2fa/enable', { schema: enable2FASchema, preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const code = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorCode: code, twoFactorExpiry: expiry },
    });

    await sendEmail(user.email, '2FA Verification Code', `Your verification code is: ${code}`);

    return reply.send({ message: 'Verification code sent to email' });
  });

  // Verify 2FA during enable
  /*
    Route verifies OTP code for enabling 2FA.
    - Checks code match and expiry
    - Enables 2FA and clears OTP from DB
  */
  app.post('/2fa/verify', { schema: verify2FASchema, preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.id;
    const code = request.body.code.trim();

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user.twoFactorCode !== code) {
      const err = new Error('Invalid verification code');
      err.statusCode = 401;
      err.code = 'INVALID_OTP';
      throw err;
    }

    if (new Date() > user.twoFactorExpiry) {
      const err = new Error('Verification code expired');
      err.statusCode = 401;
      err.code = 'OTP_EXPIRED';
      throw err;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true, twoFactorCode: null, twoFactorExpiry: null },
    });

    return reply.send({ message: '2FA verified and enabled successfully' });
  });

  // Disable 2FA
  /*
    Route disables 2FA for authenticated user and clears any OTP.
  */
  app.post('/2fa/disable', { schema: disable2FASchema, preHandler: [app.authenticate] }, async (request, reply) => {
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
  });

  // Logout user
  /*
    Route logs out authenticated user.
    - Sets status to OFFLINE
    - Clears JWT cookie
  */
  app.post('/logout', { schema: logoutSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    if (user.status === 'OFFLINE') {
      const err = new Error('User is already offline');
      err.statusCode = 400;
      err.code = 'ALREADY_OFFLINE';
      throw err;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: 'OFFLINE' },
    });

    reply.clearCookie('token', { path: '/' });

    return reply.code(200).send({ message: 'Logout successful' });
  });

  // Check login status
  /*
    Route returns whether the client has a valid JWT token and is logged in.
  */
  app.get("/loginStatus", { schema: loginStatusSchema }, async (request, reply) => {
    const token = request.cookies.token;
    if (!token) return reply.code(200).send({ loggedIn: false });

    let payload;
    try {
      payload = app.jwt.verify(token);
    } catch {
      return reply.code(200).send({ loggedIn: false });
    }

    // Verify that the user still exists in the database
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      // User doesn't exist (e.g., after fclean), clear the cookie
      reply.clearCookie('token', { path: '/' });
      return reply.code(200).send({ loggedIn: false });
    }

    return reply.code(200).send({ loggedIn: true });
  });
}

export default authRoutes;
