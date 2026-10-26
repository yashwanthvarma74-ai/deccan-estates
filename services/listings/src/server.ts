import cors from '@fastify/cors';
import Fastify from 'fastify';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { createDb } from './db.js';
import { appRouter, type Context } from './router.js';

export function buildServer(db: Context['db']) {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' });
  app.register(cors, { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000', methods: ['GET'] });
  app.get('/health', async () => ({ status: 'ok', service: 'listings' }));
  app.register(fastifyTRPCPlugin, { prefix: '/trpc', trpcOptions: { router: appRouter, createContext: (): Context => ({ db }) } });
  return app;
}

export { createDb };
