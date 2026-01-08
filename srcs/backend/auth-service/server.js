// auth-service/server.js

import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import dotenv from 'dotenv';
import path from 'path';
import AjvErrors from 'ajv-errors';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';

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
checkEnv('DATABASE_URL', process.env.DATABASE_URL);
checkEnv('EMAIL_USER', process.env.EMAIL_USER);
checkEnv('EMAIL_PASS', process.env.EMAIL_PASS);
checkEnv('GOOGLE_CLIENT_ID', process.env.GOOGLE_CLIENT_ID);

// Initialize Fastify
const app = Fastify({
  logger: true,
  ajv: {
    customOptions: { allErrors: true, strict: false },
    plugins: [AjvErrors],
  },
});

// CORS
await app.register(cors, {
  origin: 'https://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
});

// Static file handling for avatars in the `auth` service
const avatarsPath = path.join(__dirname, 'uploads', 'avatars');
app.register(fastifyStatic, {
  root: avatarsPath,
  prefix: '/uploads/avatars/', // URL prefix to serve avatars
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

// Register Routes
app.register(authRoutes, { prefix: '/api/auth' });

// Error Handler
app.setErrorHandler((error, request, reply) => {
  request.log.error(error);

  if (error.validation?.length) {
    return reply.code(400).send({
      error: { message: error.validation[0].message, code: 'VALIDATION_ERROR' },
    });
  }

  return reply.code(error.statusCode || 500).send({
    error: { message: error.message || 'Internal Server Error', code: error.code || 'INTERNAL_ERROR' },
  });
});

// Start Server
const PORT = 5001;
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