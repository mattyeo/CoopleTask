import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
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

export const jobsRoutes =
  (service: JobsService): FastifyPluginAsync =>
  async (app) => {
    app.get('/api/jobs', async (request) => {
      const query = listQuerySchema.safeParse(request.query);
      if (!query.success) {
        throw new AppError(
          400,
          'INVALID_REQUEST',
          `page must be an integer >= 0 and pageSize an integer between 1 and ${MAX_PAGE_SIZE}`,
        );
      }
      return service.listJobs(query.data.page, query.data.pageSize);
    });

    app.get<{ Params: { id: string } }>('/api/jobs/:id', async (request) => {
      const id = jobIdSchema.safeParse(request.params.id);
      if (!id.success) {
        throw new AppError(400, 'INVALID_JOB_ID', 'The job id is not a valid identifier');
      }
      return service.getJob(id.data);
    });
  };
