// server.js

import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import aiRoutes from './routes/ai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent folder
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = Fastify({ logger: true });

// CORS
await app.register(cors, {
  origin: process.env.FRONTEND_URL || 'https://silver-space-winner-977xxpx6p6j4h79q-443.app.github.dev/',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

// JWT
if (!process.env.JWT_SECRET) {
  throw new Error("❌ Missing JWT_SECRET in environment variables!");
}

app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET,
});

app.register(fastifyCookie);

// JWT authentication decorator
app.decorate('authenticate', async function (request, reply) {
  try {
    const token = request.cookies.token;
    if (!token) {
      return reply.code(401).send({ error: 'Missing token' });
    }

    const decoded = await app.jwt.verify(token);
    request.user = decoded;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return reply.code(401).send({ error: 'Token expired' });
    } else if (err.name === 'JsonWebTokenError') {
      return reply.code(401).send({ error: 'Invalid token' });
    } else {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  }
});

// Register routes
app.register(aiRoutes);

// Health check
app.get('/health', async (request, reply) => {
  return { status: 'ok', service: 'ai-service' };
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.AI_PORT) || 5007;
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`🤖 AI Service running on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();