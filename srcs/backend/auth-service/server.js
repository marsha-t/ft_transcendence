// server.js

import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import cors from '@fastify/cors';
import AjvErrors from 'ajv-errors';

// ------- JWT ---------------------
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
// Resolve the parent directory (one level up from backend/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the parent folder
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// --------------------------------

// needed imports for the avatar
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';


// import to download openapi.json
import fs from 'fs';


const app = Fastify({ logger: true, 
  ajv: {
    customOptions: {
      allErrors: true
    },
    plugins: [AjvErrors] 
  }
});

// CORS setup (adjust origin for your frontend)
const allowedOrigins = (process.env.CORS_ORIGINS || 'https://localhost,https://localhost:443,http://localhost:3000').split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

await app.register(cors, {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
});

// Swagger ------------------------------------------
await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Authentication Service Backend',
        description: 'API docs for our authentication routes',
        version: '1.0.0',
      },
      servers: [
        { url: 'http://127.0.0.1:5002/' }, // Use this when working on codespaces!
        { url: 'http://localhost:5002/' }, // Use this when working locally!
      ],
      
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
    uiHooks: {
      onComplete: () => {
        // 👇 Make Swagger send cookies automatically with every request
        window.ui.getConfigs().requestInterceptor = (req) => {
          req.withCredentials = true;
          return req;
        };
      },
    },
  });
// ------------------------------------------------------

// Register fastifyStatic and fastifyMultipart -> needed for saving and serving the uploaded avatars to the frontend
app.register(fastifyStatic, {
  root: path.join(process.cwd(), 'uploads'),
  prefix: '/uploads/',
});

app.register(fastifyMultipart);

// ------------ JWT ------------------
if (!process.env.JWT_SECRET) {
  throw new Error("❌ Missing JWT_SECRET in environment variables!");
}

app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET,
});

app.register(fastifyCookie);

app.decorate('authenticate', async function (request, reply) {
  try {
    const token = request.cookies.token;
    if (!token) {
      return reply.code(401).send({ error: 'Missing token' });
    }

    const decoded = await app.jwt.verify(token);
    request.user = decoded;
  } catch (err) {
    // err.name can help differentiate
    if (err.name === 'TokenExpiredError') {
      return reply.code(401).send({ error: 'Token expired' });
    } else if (err.name === 'JsonWebTokenError') {
      return reply.code(401).send({ error: 'Invalid token' });
    } else {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  }
});
app.register(authRoutes, { prefix: '/api/auth' });
// app.register(userStatsRoutes, { prefix: '/api' });


// ----------------------------------

// To save openapi.json file (needs to be after registering routes and before app.listen)
// To save, uncomment the code
await app.ready(); // wait until all routes are registered
// fs.writeFileSync('/app/openapi.json', JSON.stringify(app.swagger(), null, 2));

const start = async () => {
  try {
    await app.listen({ port: 5001, host: '0.0.0.0' });
    console.log(`Auth service running on port 5001`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();