// routes/auth.js

import { registerSchema, loginSchema } from '../schemas/auth.js';
import prisma from '../prisma/prismaClient.js';
import bcrypt from 'bcrypt';

async function authRoutes(app, options) {

  // Register route
  app.post('/api/register', { schema: registerSchema }, async (request, reply) => {
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
      return reply.code(409).send({ error: 'Username or email already exists' });
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

    return reply.code(201).send({ message: 'User registered successfully' });
  });


  // Login Route
  app.post('/api/login', { schema: loginSchema }, async (request, reply) => {
    const { username, password } = request.body;

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return reply.code(401).send({ error: 'Invalid username' });
    }

    // Compare entered password with hashed password in DB
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return reply.code(401).send({ error: 'Invalid password' });
    }

    // Success
    return reply.code(200).send({ message: 'Login successful' });
  });
}

export default authRoutes;