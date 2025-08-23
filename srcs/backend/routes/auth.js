// routes/auth.js

import { registerSchema, loginSchema } from '../schemas/auth.js';
import bcrypt from 'bcrypt';

const users = []; // this is our temporary fake database

async function authRoutes(app, options) {

  // Register route
  app.post('/api/register', { schema: registerSchema }, async (request, reply) => {
    const { username, email, password } = request.body;

    // Check if username already exists
    const userExists = users.find(
      (user) => user.username === username
    );

    if (userExists) {
      return reply.code(409).send({ error: 'Username already exists' });
    }

    // Check if email already exists
    const emailExists = users.find(
      (user) => user.email === email
    );

    if (emailExists) {
      return reply.code(409).send({ error: 'Email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Store user
    users.push({ username, email, password: hashedPassword });

    return reply.code(201).send({ message: 'User registered successfully' });
  });


  // Login Route
  app.post('/api/login', { schema: loginSchema }, async (request, reply) => {
    const { username, password } = request.body;

    // Find user by username
    const user = users.find((u) => u.username === username);

    if (!user) {
      return reply.code(401).send({ error: 'Invalid username or password' });
    }

    // Compare entered password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return reply.code(401).send({ error: 'Invalid username or password' });
    }

    // Success
    return reply.code(200).send({ message: 'Login successful' });
  });
}

export default authRoutes;