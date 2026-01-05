import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import dotenv from 'dotenv';
import path from 'path';
import AjvErrors from 'ajv-errors';
import { fileURLToPath } from 'url';
import gameSessionRoutes from './routes/gameSession.js'; 
import gameSessionPlayersRoutes from './routes/gameSessionPlayers.js'; 
import tournamentRoutes from './routes/tournament.js';
import aiRoutes from './routes/ai.js';
import fastifyWebsocket from '@fastify/websocket';
import websocketRoutes from './routes/websocket.js';

// Resolve __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });


// Critical Environment Checks
const checkEnv = (name, value) => {
  if (!value) {
    const err = new Error(`Missing environment variable: ${name}`);
    err.statusCode = 500;
    err.code = 'ENV_MISSING';
    throw err;
  }
};

// Check critical env vars
checkEnv('JWT_SECRET', process.env.JWT_SECRET);
checkEnv('GAME_DB_URL', process.env.GAME_DB_URL);

// Initialize Fastify
const app = Fastify({
  logger: true,
  ajv: {
    customOptions: { allErrors: true, strict: false, },
    plugins: [AjvErrors],
  },
});

// CORS
const allowedOrigins = ('https://localhost,https://localhost:443,https://localhost:8080')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

await app.register(cors, {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
});

// JWT Authentication
app.register(fastifyJwt, { secret: process.env.JWT_SECRET });
app.register(fastifyCookie);


app.decorate('authenticate', async (request) => {
  try {
    const token = request.cookies.token;
    if (!token) {
      const err = new Error('Missing token');
      err.statusCode = 401;
      err.code = 'MISSING_TOKEN';
      throw err;
    }

    request.user = await app.jwt.verify(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      const e = new Error('Token expired');
      e.statusCode = 401;
      e.code = 'TOKEN_EXPIRED';
      throw e;
    } else if (err.name === 'JsonWebTokenError') {
      const e = new Error('Invalid token');
      e.statusCode = 401;
      e.code = 'INVALID_TOKEN';
      throw e;
    } else {
      const e = new Error('Unauthorized');
      e.statusCode = 401;
      e.code = 'UNAUTHORIZED';
      throw e;
    }
  }
});

// Register websocket support
await app.register(fastifyWebsocket);

// Register Routes (HTTP)
app.register(gameSessionRoutes, { prefix: '/api/gameSessionServ' });
app.register(gameSessionPlayersRoutes, { prefix: '/api/gameSessionPlayersServ' });
app.register(tournamentRoutes, { prefix: '/api/tournamentServ' });
app.register(aiRoutes, { prefix: '/api/ai' });

// Register Routes (WebSocket)
app.register(websocketRoutes, {prefix: '/ws'});

// Error Handler
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
const PORT = 5005;
const start = async () => {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Service running at http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
