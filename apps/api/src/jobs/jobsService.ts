import type { JobDetails, JobSummary, Page } from '@coople-jobs/shared';
import type { CoopleClient } from '../coople/coopleClient';
import {
  UpstreamError,
  UpstreamInvalidResponseError,
  UpstreamNotFoundError,
  UpstreamTimeoutError,
  UpstreamUnavailableError,
} from '../coople/coopleErrors';
import { AppError } from '../errors';
import { toJobDetails, toJobSummary } from './jobMappers';

export interface JobsService {
  listJobs(page: number, pageSize: number): Promise<Page<JobSummary>>;
  getJob(id: string): Promise<JobDetails>;
}

export interface JobsServiceLogger {
  warn(details: object, message: string): void;
}

export function createJobsService(client: CoopleClient, logger: JobsServiceLogger): JobsService {
  function toAppError(error: unknown): unknown {
    if (!(error instanceof UpstreamError)) return error;

    if (error instanceof UpstreamNotFoundError) {
      return new AppError(404, 'JOB_NOT_FOUND', 'This job does not exist');
    }

    logger.warn({ upstreamError: error.name, details: error.details }, error.message);

    if (error instanceof UpstreamTimeoutError) {
      return new AppError(504, 'UPSTREAM_TIMEOUT', 'The jobs provider took too long to answer');
    }
    if (error instanceof UpstreamInvalidResponseError) {
      return new AppError(
        502,
        'UPSTREAM_INVALID_RESPONSE',
        'The jobs provider returned an unexpected response',
      );
    }
    if (error instanceof UpstreamUnavailableError) {
      return new AppError(502, 'UPSTREAM_UNAVAILABLE', 'The jobs provider is not available');
    }
    return error;
  }

  return {
    async listJobs(page, pageSize) {
      try {
        const { items, total } = await client.listJobs(page, pageSize);
        return {
          items: items.map(toJobSummary),
          page,
          pageSize,
          total,
          hasNextPage: (page + 1) * pageSize < total,
        };
      } catch (error) {
        throw toAppError(error);
      }
    },

    async getJob(id) {
      try {
        return toJobDetails(await client.getJob(id));
      } catch (error) {
        throw toAppError(error);
      }
    },
  };
}
