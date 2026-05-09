import Fastify from 'fastify';
import cors from '@fastify/cors';
import { runIndexer } from './indexer/index';
import { wrappedRoutes } from './api/routes/wrapped';
import 'dotenv/config';

const server = Fastify({ logger: true });

async function main() {
  await server.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await server.register(wrappedRoutes);

  const port = parseInt(process.env.PORT || '3001');
  await server.listen({ port, host: '0.0.0.0' });

  runIndexer().catch(console.error);
}

main().catch(console.error);


