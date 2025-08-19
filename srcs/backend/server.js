// server.js

import Fastify from 'fastify';
import authRoutes from './routes/auth.js'; // import auth routes

const app = Fastify({ logger: true });

// Test route
app.get('/api/ping', async (request, reply) => {
  return { msg: 'pong' };
});

// Register auth routes
authRoutes(app); // this will add /api/register (and any future auth routes /api/login) to the app

const start = async () => {
  try {
    await app.listen({ port: 5000, host: '0.0.0.0' });
    console.log('Server running at http://localhost:5000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
