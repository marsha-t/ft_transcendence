// routes/auth.js

const users = []; // this is our temporary fake database

async function authRoutes(app, options) {
  app.post('/api/register', async (request, reply) => {
    const { username, email, password } = request.body;

    // Validate input
    if (!username || !email || !password) {
      return reply.code(400).send({ error: 'Username, email, and password are required' });
    }

    // Check if email or username already exists
    const userExists = users.find(
      (user) => user.username === username || user.email === email
    );

    if (userExists) {
      return reply.code(409).send({ error: 'Username or email already exists' });
    }

    // Store user
    users.push({ username, email, password });

    return reply.code(201).send({ message: 'User registered successfully' });
  });
}

export default authRoutes;