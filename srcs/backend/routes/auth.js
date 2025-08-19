// routes/auth.js

const users = []; // this is our temporary fake database

async function authRoutes(app, options) {
  app.post('/api/register', async (request, reply) => {
    const { username, email, password } = request.body;

    // 1- Check input
    if (!username || !email || !password) {
      return reply.code(400).send({ 
        error: 'Username, email, and password are required' });
    }

    // 2- Validate username
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

    if (!usernameRegex.test(username)) {
      return reply.code(400).send({
        error: 'Username must be 3-20 characters and contain only letters, numbers, or underscores'
      });
    }

    // 3- Validate password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$/;

    if (!passwordRegex.test(password)) {
      return reply.code(400).send({
        error: 'Password must be at least 12 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.'
      });
    }

    // 4- Validate email syntax
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return reply.code(400).send({ 
        error: 'Invalid email format' 
      });
    }

    // 5- Check if username already exists
    const userExists = users.find(
      (user) => user.username === username
    );

    if (userExists) {
      return reply.code(409).send({ error: 'Username already exists' });
    }

    // 6- Check if email already exists
    const emailExists = users.find(
      (user) => user.email === email
    );

    if (emailExists) {
      return reply.code(409).send({ error: 'Email already exists' });
    }

    // 7- Store user
    users.push({ username, email, password });

    return reply.code(201).send({ message: 'User registered successfully' });
  });
}

export default authRoutes;