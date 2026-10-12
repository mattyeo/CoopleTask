import type { ZodType } from 'zod';
import {
  UpstreamInvalidResponseError,
  UpstreamNotFoundError,
  UpstreamTimeoutError,
  UpstreamUnavailableError,
  type UpstreamError,
} from './coopleErrors';
import {
  OBJECT_NOT_FOUND_ERROR_CODE,
  coopleEnvelopeSchema,
  coopleJobDetailsSchema,
  coopleJobListSchema,
  type CoopleJobDetailsDto,
  type CoopleJobListDto,
} from './coopleSchemas';

export interface CoopleClient {
  listJobs(pageNum: number, pageSize: number): Promise<CoopleJobListDto>;
  getJob(id: string): Promise<CoopleJobDetailsDto>;
}

export interface CoopleClientLogger {
  warn(details: object, message: string): void;
}

export interface CoopleClientOptions {
  baseUrl: string;
  timeoutMs: number;
  fetch?: typeof fetch;
  logger?: CoopleClientLogger;
}

interface RequestOptions {
  /** Whether a "not found" answer means the requested resource does not exist. */
  notFoundIsMissing: boolean;
}

export function createCoopleClient(options: CoopleClientOptions): CoopleClient {
  const baseUrl = options.baseUrl.replace(/\/+$/, '');
  const fetchFn = options.fetch ?? fetch;

  function fail(error: UpstreamError, url: string): never {
    options.logger?.warn({ url, details: error.details }, error.message);
    throw error;
  }

  async function readBody(url: string): Promise<{ status: number; ok: boolean; body: unknown }> {
    try {
      const response = await fetchFn(url, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(options.timeoutMs),
      });
      const text = await response.text();
      return { status: response.status, ok: response.ok, body: parseJson(text) };
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'TimeoutError') {
        return fail(
          new UpstreamTimeoutError(`Coople did not answer within ${options.timeoutMs} ms`, {
            cause,
          }),
          url,
        );
      }
      return fail(new UpstreamUnavailableError('Could not reach Coople', { cause }), url);
    }
  }

  async function request<T>(
    url: string,
    schema: ZodType<T>,
    { notFoundIsMissing }: RequestOptions,
  ): Promise<T> {
    const { status, ok, body } = await readBody(url);
    const envelope = coopleEnvelopeSchema.safeParse(body);

    if (!envelope.success) {
      if (ok) {
        return fail(
          new UpstreamInvalidResponseError('Coople response is not a valid envelope', {
            status,
            issues: envelope.error.issues,
          }),
          url,
        );
      }
      return fail(
        new UpstreamUnavailableError(`Coople answered with HTTP ${status}`, { status }),
        url,
      );
    }

    const { errorCode, error, data } = envelope.data;

    if (!ok || error) {
      const details = { status, errorCode };
      if (notFoundIsMissing && (status === 404 || errorCode === OBJECT_NOT_FOUND_ERROR_CODE)) {
        return fail(new UpstreamNotFoundError('Job not found at Coople', details), url);
      }
      return fail(
        new UpstreamUnavailableError(`Coople answered with HTTP ${status} (${errorCode})`, details),
        url,
      );
    }

    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      return fail(
        new UpstreamInvalidResponseError('Coople response does not match the expected schema', {
          status,
          issues: parsed.error.issues,
        }),
        url,
      );
    }
    return parsed.data;
  }

  return {
    listJobs(pageNum, pageSize) {
      const query = new URLSearchParams({
        pageNum: String(pageNum),
        pageSize: String(pageSize),
      });
      return request(`${baseUrl}/list?${query.toString()}`, coopleJobListSchema, {
        notFoundIsMissing: false,
      });
    },
    getJob(id) {
      return request(`${baseUrl}/${encodeURIComponent(id)}`, coopleJobDetailsSchema, {
        notFoundIsMissing: true,
      });
    },
  };
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
