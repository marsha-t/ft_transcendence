// authservice/server.js
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import profileRoutes from './routes/profile.js';
import AjvErrors from 'ajv-errors';
import userStatsRoutes from './routes/userStats.js';

// Resolve __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = Fastify({
  logger: true,
  ajv: {
    customOptions: {
      allErrors: true,
      strict: false,
    },
    plugins: [AjvErrors],
  },
});

// CORS setup (adjust origin for your frontend)
const allowedOrigins = (process.env.CORS_ORIGINS || 'https://localhost,https://localhost:443,http://localhost:3000').split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

await app.register(cors, {
  origin: allowedOrigins,
  credentials: true,
});

// JWT setup
if (!process.env.JWT_SECRET) throw new Error("Missing JWT_SECRET");
app.register(fastifyJwt, { secret: process.env.JWT_SECRET });
app.register(fastifyCookie);

//limit for uploaded files
app.register(fastifyMultipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
});
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
app.register(profileRoutes, { prefix: '/api/profileServ' });
app.register(userStatsRoutes, { prefix: '/api/profileServ' });


// Start server
const PORT = process.env.PROFILE_SERVICE_PORT || 5002;
const start = async () => {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Profile Service running at http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
