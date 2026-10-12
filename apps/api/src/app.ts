import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import type { CoopleClient } from './coople/coopleClient';
import type { AppConfig } from './config';
import { registerErrorHandlers } from './errors';
import { jobsRoutes } from './jobs/jobsRoutes';
import { createJobsService } from './jobs/jobsService';

export interface AppDeps {
  config: AppConfig;
  coopleClient: CoopleClient;
}

export async function buildApp(
  deps: AppDeps,
  options: { logger?: boolean } = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? false });

  registerErrorHandlers(app);
  await app.register(cors, { origin: deps.config.corsOrigin });

  app.get('/api/health', async () => ({ status: 'ok' }));
  await app.register(
    jobsRoutes(createJobsService(deps.coopleClient, app.log), {
      listMaxAgeMs: deps.config.listCacheTtlMs,
      detailsMaxAgeMs: deps.config.detailsCacheTtlMs,
    }),
  );

  return app;
}
