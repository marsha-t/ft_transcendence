// server.js

import Fastify from 'fastify';
import authRoutes from './routes/auth.js'; // import auth routes
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

const app = Fastify({ logger: true });

// Swagger ------------------------------------------
await app.register(swagger, {
    openapi: {
      info: {
        title: 'ft_transcendence Backend',
        description: 'API docs for our backend routes',
        version: '1.0.0',
      },
      servers: [
        { url: 'https://congenial-space-winner-x5544j4rjr4ph9v9r-5000.app.github.dev/' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
  });

  // Register your routes
  // app.register(authRoutes); ???????????
// ------------------------------------------------------

// Test route
app.get('/api/ping', async (request, reply) => {
  return { msg: 'pong' };
});

// Register auth routes
authRoutes(app);

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
