// profile-service/server.js

import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import jwt from 'jsonwebtoken';
import fastifyMultipart from '@fastify/multipart';
import dotenv from 'dotenv';
import path from 'path';
import AjvErrors from 'ajv-errors';
import { fileURLToPath } from 'url';
import profileRoutes from './routes/profile.js';
import userStatsRoutes from './routes/userStats.js';

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
checkEnv('JWT_SERVICE_SECRET', process.env.JWT_SERVICE_SECRET);
checkEnv('DATABASE_URL', process.env.DATABASE_URL);

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
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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

// Inter-services authentication
app.decorate('authenticateService', async (request) => {
  try {
    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      const err = new Error('Missing Authorization header');
      err.statusCode = 401;
      err.code = 'MISSING_AUTH_HEADER';
      throw err;
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) {
      const err = new Error('Missing token');
      err.statusCode = 401;
      err.code = 'MISSING_TOKEN';
      throw err;
    }

    jwt.verify(token, process.env.JWT_SERVICE_SECRET);
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

// Register multipart plugin to handle file uploads (user avatars)
app.register(fastifyMultipart);

// Register Routes
app.register(profileRoutes, { prefix: '/api/profileServ' }); 
app.register(userStatsRoutes, { prefix: '/api/profileServ' });

// Error Handler
function ajvErrorToCode(err) {
   const keyword =
    err.keyword === 'errorMessage'
      ? err.params?.errors?.[0]?.keyword
      : err.keyword;

  const field =
    keyword === 'required'
      ? err.params?.missingProperty
      : err.instancePath?.replace('/', '');

  const FIELD = field ? field.toUpperCase() : 'BODY';

  switch (keyword) {
    case 'required':
      return `${FIELD}_REQUIRED`;

    case 'minLength':
      return `${FIELD}_TOO_SHORT`;

    case 'maxLength':
      return `${FIELD}_TOO_LONG`;

    case 'pattern':
    case 'format':
      return `${FIELD}_INVALID_FORMAT`;

    case 'additionalProperties':
      return `EXTRA_FIELDS_NOT_ALLOWED`;

    default:
      return `VALIDATION_ERROR`;
  }
}

app.setErrorHandler((error, request, reply) => {
  request.log.error(error);

  if (error.validation?.length) {
    return reply.code(400).send({
      error: { message: error.validation[0].message, code: ajvErrorToCode(error.validation[0]) },
    });
  }

  return reply.code(error.statusCode || 500).send({
    error: { message: error.message || 'Internal Server Error', code: error.code || 'INTERNAL_ERROR' },
  });
});

// Start Server
const PORT = 5002;
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