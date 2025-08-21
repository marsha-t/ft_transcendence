// routes/auth.js

import { registerSchema } from '../schemas/auth.js';
import bcrypt from 'bcrypt';

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

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Log to check
    // console.log('Username:', username);
    // console.log('Email:', email);
    // console.log('Password:', password);
    // console.log('Hashed password:', hashedPassword);

    // Store user
    users.push({ username, email, password: hashedPassword });

    return reply.code(201).send({ message: 'User registered successfully' });
  });
}

export default authRoutes;