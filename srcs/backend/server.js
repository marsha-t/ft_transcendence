// server.js
import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/api/ping', async (request, reply) => {
  return { msg: 'pong' };
});

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
