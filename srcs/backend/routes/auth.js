// routes/auth.js

import { registerSchema } from '../schemas/auth.js';

const users = []; // this is our temporary fake database

async function authRoutes(app, options) {
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

    // Store user
    users.push({ username, email, password });

    return reply.code(201).send({ message: 'User registered successfully' });
  });
}

export default authRoutes;