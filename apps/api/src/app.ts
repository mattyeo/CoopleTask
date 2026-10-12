import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import type { AppConfig } from './config';
import { registerErrorHandlers } from './errors';

export interface AppDeps {
  config: AppConfig;
}

export async function buildApp(
  deps: AppDeps,
  options: { logger?: boolean } = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? false });

  registerErrorHandlers(app);
  await app.register(cors, { origin: deps.config.corsOrigin });

  app.get('/api/health', async () => ({ status: 'ok' }));

  return app;
}
