import type { ApiErrorBody } from '@coople-jobs/shared';
import { config } from '@/shared/config';
import { ApiError, isRetryable } from '@/shared/api/ApiError';
import { request } from '@/shared/api/apiClient';
import { fetchJob, fetchJobs } from '@/features/jobs/api/jobsApi';
import { MAX_RETRIES, shouldRetryQuery } from '@/shared/api/queryClient';

const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>();

function respond(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () =>
      body === undefined
        ? Promise.reject(new SyntaxError('Unexpected token'))
        : Promise.resolve(body),
  } as Response;
}

function errorBody(
  code: ApiErrorBody['error']['code'],
  message = 'Something went wrong',
): ApiErrorBody {
  return { error: { code, message } };
}

async function catchError(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(
    () => {
      throw new Error('Expected the promise to reject');
    },
    (error: unknown) => error,
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

describe('request', () => {
  it('returns the parsed body on 200', async () => {
    fetchMock.mockResolvedValue(respond(200, { status: 'ok' }));

    await expect(request<{ status: string }>('/api/health')).resolves.toEqual({ status: 'ok' });
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${config.apiUrl}/api/health`);
  });

  it('turns a contract error body into an ApiError with its code', async () => {
    fetchMock.mockResolvedValue(
      respond(404, errorBody('JOB_NOT_FOUND', 'This job does not exist')),
    );

    const error = await catchError(request('/api/jobs/x'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      code: 'JOB_NOT_FOUND',
      status: 404,
      message: 'This job does not exist',
    });
  });

  it('falls back to INTERNAL_ERROR when a 500 body is not JSON', async () => {
    fetchMock.mockResolvedValue(respond(500, undefined));

    const error = await catchError(request('/api/jobs'));

    expect(error).toMatchObject({ code: 'INTERNAL_ERROR', status: 500 });
  });

  it('falls back to INTERNAL_ERROR when the error body is JSON but not the contract', async () => {
    fetchMock.mockResolvedValue(respond(502, { message: 'Bad gateway' }));

    expect(await catchError(request('/api/jobs'))).toMatchObject({
      code: 'INTERNAL_ERROR',
      status: 502,
    });
  });

  it('does not trust an unknown error code', async () => {
    fetchMock.mockResolvedValue(respond(400, { error: { code: 'SOMETHING_NEW', message: 'x' } }));

    expect(await catchError(request('/api/jobs'))).toMatchObject({
      code: 'INTERNAL_ERROR',
      status: 400,
    });
  });

  it('turns a rejected fetch into a NETWORK_ERROR without a status', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await catchError(request('/api/jobs'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'NETWORK_ERROR', status: null });
  });

  it('reports a 200 response with an unreadable body as INTERNAL_ERROR', async () => {
    fetchMock.mockResolvedValue(respond(200, undefined));

    expect(await catchError(request('/api/jobs'))).toMatchObject({
      code: 'INTERNAL_ERROR',
      status: 200,
    });
  });

  it('rethrows the original error when the request was aborted', async () => {
    const controller = new AbortController();
    const abortError = new DOMException('Aborted', 'AbortError');
    fetchMock.mockImplementation(() => {
      controller.abort();
      return Promise.reject(abortError);
    });

    expect(await catchError(request('/api/jobs', { signal: controller.signal }))).toBe(abortError);
  });
});

describe('jobsApi', () => {
  it('requests a page of jobs with its query parameters', async () => {
    fetchMock.mockResolvedValue(
      respond(200, { items: [], page: 2, pageSize: 10, total: 0, hasNextPage: false }),
    );

    await fetchJobs({ page: 2, pageSize: 10 });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${config.apiUrl}/api/jobs?page=2&pageSize=10`);
  });

  it('requests a single job and encodes the id', async () => {
    fetchMock.mockResolvedValue(respond(200, {}));

    await fetchJob('a/b c');

    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${config.apiUrl}/api/jobs/a%2Fb%20c`);
  });
});

describe('isRetryable', () => {
  const cases: Array<{ label: string; error: unknown; expected: boolean }> = [
    {
      label: 'network error',
      error: new ApiError('NETWORK_ERROR', 'offline', null),
      expected: true,
    },
    {
      label: 'upstream unavailable (502)',
      error: new ApiError('UPSTREAM_UNAVAILABLE', 'down', 502),
      expected: true,
    },
    {
      label: 'upstream timeout (504)',
      error: new ApiError('UPSTREAM_TIMEOUT', 'slow', 504),
      expected: true,
    },
    {
      label: 'upstream invalid response (502)',
      error: new ApiError('UPSTREAM_INVALID_RESPONSE', 'bad', 502),
      expected: true,
    },
    {
      label: 'internal error (500)',
      error: new ApiError('INTERNAL_ERROR', 'boom', 500),
      expected: true,
    },
    {
      label: 'job not found (404)',
      error: new ApiError('JOB_NOT_FOUND', 'missing', 404),
      expected: false,
    },
    {
      label: 'invalid job id (400)',
      error: new ApiError('INVALID_JOB_ID', 'bad id', 400),
      expected: false,
    },
    {
      label: 'invalid request (400)',
      error: new ApiError('INVALID_REQUEST', 'bad', 400),
      expected: false,
    },
    {
      label: 'unreadable 200 response',
      error: new ApiError('INTERNAL_ERROR', 'garbled', 200),
      expected: false,
    },
    { label: 'a plain Error', error: new Error('bug'), expected: false },
    { label: 'a non-error value', error: 'oops', expected: false },
  ];

  it.each(cases)('$label -> retryable: $expected', ({ error, expected }) => {
    expect(isRetryable(error)).toBe(expected);
  });
});

describe('shouldRetryQuery', () => {
  const retryable = new ApiError('NETWORK_ERROR', 'offline', null);
  const notRetryable = new ApiError('JOB_NOT_FOUND', 'missing', 404);

  it('retries retryable errors up to the maximum', () => {
    expect(MAX_RETRIES).toBe(2);
    expect(shouldRetryQuery(0, retryable)).toBe(true);
    expect(shouldRetryQuery(1, retryable)).toBe(true);
    expect(shouldRetryQuery(2, retryable)).toBe(false);
  });

  it('never retries client errors', () => {
    expect(shouldRetryQuery(0, notRetryable)).toBe(false);
  });
});
