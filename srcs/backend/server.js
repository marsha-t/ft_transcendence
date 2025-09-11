// server.js

import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

// needed imports for the avatar
import path from 'path';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';

// import routes
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import friendsRoutes from './routes/friends.js';
import gameSessionRoutes from './routes/gameSession.js' 
import gameSessionPlayersRoutes from './routes/gameSessionPlayers.js';
import fs from 'fs';


const app = Fastify({ logger: true });

// Swagger ------------------------------------------
await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'ft_transcendence Backend',
        description: 'API docs for our backend routes',
        version: '1.0.0',
      },
      servers: [
        { url: 'http://localhost:5000' },
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
// ------------------------------------------------------

// Register fastifyStatic and fastifyMultipart -> needed for saving and serving the uploaded avatars to the frontend
app.register(fastifyStatic, {
  root: path.join(process.cwd(), 'uploads'),
  prefix: '/uploads/',
});

app.register(fastifyMultipart);

// Test route
app.get('/api/ping', async (request, reply) => {
  return { msg: 'pong' };
});


// Register our routes in the server
app.register(authRoutes);
app.register(profileRoutes);
app.register(friendsRoutes);
app.register(gameSessionRoutes);
app.register(gameSessionPlayersRoutes);

// after app.register(...) and before app.listen
await app.ready(); // wait until all routes are registered
// fs.writeFileSync('/app/openapi.json', JSON.stringify(app.swagger(), null, 2));


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
