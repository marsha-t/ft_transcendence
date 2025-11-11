// authservice/server.js
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js'; // your existing auth routes

// Resolve __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = Fastify({ logger: true });

// CORS setup (adjust origin for your frontend)
await app.register(cors, {
  origin: 'http://localhost:3000', // frontend URL
  credentials: true,
});

// JWT setup
if (!process.env.JWT_SECRET) throw new Error("Missing JWT_SECRET");
app.register(fastifyJwt, { secret: process.env.JWT_SECRET });
app.register(fastifyCookie);

// JWT authentication decorator
app.decorate('authenticate', async (request, reply) => {
  try {
    const token = request.cookies.token;
    if (!token) return reply.code(401).send({ error: 'Missing token' });
    request.user = await app.jwt.verify(token);
  } catch (err) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
});

// Register Auth Routes
app.register(authRoutes);

// Start server
const PORT = process.env.AUTH_PORT || 5002;
const start = async () => {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Auth Service running at http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
