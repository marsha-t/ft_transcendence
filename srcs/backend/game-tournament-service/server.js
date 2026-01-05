// authservice/server.js
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import gameSessionRoutes from './routes/gameSession.js'; 
import gameSessionPlayersRoutes from './routes/gameSessionPlayers.js'; 
import tournamentRoutes from './routes/tournament.js';
import AjvErrors from 'ajv-errors';
import aiRoutes from './routes/ai.js';
import fastifyWebsocket from '@fastify/websocket';
import websocketRoutes from './routes/websocket.js';

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

await app.register(fastifyWebsocket); //Websocket

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
app.register(gameSessionRoutes, { prefix: '/api/gameSessionServ' });
app.register(gameSessionPlayersRoutes, { prefix: '/api/gameSessionPlayersServ' });
app.register(tournamentRoutes, { prefix: '/api/tournamentServ' });
app.register(aiRoutes, { prefix: '/api/ai' });
//register websocket routes
app.register(websocketRoutes, {prefix: '/ws'});


app.setErrorHandler((error, request, reply) => {
  request.log.error(error);

  // AJV validation error
  if (error.validation?.length) {
    return reply.code(400).send({
      error: {
        message: error.validation[0].message,
        code: 'VALIDATION_ERROR',
      },
    });
  }

  // 2 Prisma unique constraint
  if (error.code === 'P2002') {
    return reply.code(409).send({
      error: {
        message: 'Resource already exists',
        code: 'DUPLICATE_RESOURCE',
      },
    });
  }

  return reply.code(error.statusCode || 500).send({
    error: {
      message: error.message || 'Internal Server Error',
      code: error.code || 'INTERNAL_ERROR',
    },
  });
});


// Start server
const PORT = process.env.GAME_SESSION_SERVICE_PORT || 5005;
const start = async () => {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Game Session Service running at http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
