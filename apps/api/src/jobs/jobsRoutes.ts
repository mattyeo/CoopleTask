import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { cacheControlFor } from '../cache/cacheControl';
import { AppError } from '../errors';
import type { JobsService } from './jobsService';

const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 50;

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

// `guid` accepts any 8-4-4-4-12 hex id, so ids with unusual version bits still reach Coople.
const jobIdSchema = z.guid();

export interface JobsRoutesOptions {
  /** How long a browser may reuse a list answer without asking again. */
  listMaxAgeMs: number;
  detailsMaxAgeMs: number;
}

export const jobsRoutes =
  (service: JobsService, options: JobsRoutesOptions): FastifyPluginAsync =>
  async (app) => {
    app.get('/api/jobs', async (request, reply) => {
      const query = listQuerySchema.safeParse(request.query);
      if (!query.success) {
        throw new AppError(
          400,
          'INVALID_REQUEST',
          `page must be an integer >= 0 and pageSize an integer between 1 and ${MAX_PAGE_SIZE}`,
        );
      }
      const page = await service.listJobs(query.data.page, query.data.pageSize);
      // Only successful answers are cacheable; the error handler marks errors `no-store`.
      reply.header('cache-control', cacheControlFor(options.listMaxAgeMs));
      return page;
    });

    app.get<{ Params: { id: string } }>('/api/jobs/:id', async (request, reply) => {
      const id = jobIdSchema.safeParse(request.params.id);
      if (!id.success) {
        throw new AppError(400, 'INVALID_JOB_ID', 'The job id is not a valid identifier');
      }
      const job = await service.getJob(id.data);
      reply.header('cache-control', cacheControlFor(options.detailsMaxAgeMs));
      return job;
    });
  };
