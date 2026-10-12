import { beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';
import { cacheControlFor } from '../src/cache/cacheControl';
import { createCachedCoopleClient } from '../src/coople/cachedCoopleClient';
import {
  UpstreamInvalidResponseError,
  UpstreamNotFoundError,
  UpstreamTimeoutError,
  UpstreamUnavailableError,
} from '../src/coople/coopleErrors';
import { coopleJobDetailsSchema, coopleJobListSchema } from '../src/coople/coopleSchemas';
import { loadConfig } from '../src/config';
import detailsFixture from './fixtures/details.json';
import listFixture from './fixtures/list.json';
import { createStubCoopleClient } from './stubCoopleClient';

const JOB_ID = '2c92cf2f-5073-4842-bedd-580e3a8feea9';
const NIL_UUID = '00000000-0000-0000-0000-000000000000';

const listDto = coopleJobListSchema.parse(listFixture.data);
const detailsDto = coopleJobDetailsSchema.parse(detailsFixture.data);

let stub: ReturnType<typeof createStubCoopleClient>;

beforeEach(() => {
  stub = createStubCoopleClient();
  stub.listJobs.mockResolvedValue(listDto);
  stub.getJob.mockResolvedValue(detailsDto);
});

describe('cacheControlFor', () => {
  it('turns a time-to-live into a public max-age in whole seconds', () => {
    expect(cacheControlFor(60_000)).toBe('public, max-age=60');
    expect(cacheControlFor(300_000)).toBe('public, max-age=300');
    expect(cacheControlFor(1_500)).toBe('public, max-age=1');
  });

  it('forbids caching when there is no time-to-live', () => {
    expect(cacheControlFor(0)).toBe('no-store');
    expect(cacheControlFor(999)).toBe('no-store');
  });
});

describe('cache configuration', () => {
  it('defaults to 60 s for lists and 5 minutes for details', () => {
    expect(loadConfig({})).toMatchObject({ listCacheTtlMs: 60_000, detailsCacheTtlMs: 300_000 });
  });

  it('reads the time-to-live from the environment, 0 included', () => {
    const config = loadConfig({ CACHE_LIST_TTL_MS: '0', CACHE_DETAILS_TTL_MS: '1000' });

    expect(config).toMatchObject({ listCacheTtlMs: 0, detailsCacheTtlMs: 1000 });
  });

  it.each(['-1', 'abc', '1.5'])('rejects the invalid time-to-live "%s"', (value) => {
    expect(() => loadConfig({ CACHE_LIST_TTL_MS: value })).toThrow(/Invalid environment/);
  });
});

describe('Cache-Control headers', () => {
  async function appWith(env: Record<string, string> = {}) {
    return buildApp({ config: loadConfig(env), coopleClient: stub });
  }

  it('lets browsers reuse a list for 60 s', async () => {
    const app = await appWith();

    const response = await app.inject({ method: 'GET', url: '/api/jobs' });

    expect(response.headers['cache-control']).toBe('public, max-age=60');
  });

  it('lets browsers reuse job details for 5 minutes', async () => {
    const app = await appWith();

    const response = await app.inject({ method: 'GET', url: `/api/jobs/${JOB_ID}` });

    expect(response.headers['cache-control']).toBe('public, max-age=300');
  });

  it('follows the configured time-to-live, and 0 means no-store', async () => {
    const app = await appWith({ CACHE_LIST_TTL_MS: '0', CACHE_DETAILS_TTL_MS: '120000' });

    const list = await app.inject({ method: 'GET', url: '/api/jobs' });
    const details = await app.inject({ method: 'GET', url: `/api/jobs/${JOB_ID}` });

    expect(list.headers['cache-control']).toBe('no-store');
    expect(details.headers['cache-control']).toBe('public, max-age=120');
  });

  const failures: Array<{ label: string; url: string; setup?: () => void; status: number }> = [
    { label: 'a bad page size', url: '/api/jobs?pageSize=0', status: 400 },
    { label: 'a malformed job id', url: '/api/jobs/not-a-uuid', status: 400 },
    {
      label: 'an unknown job',
      url: `/api/jobs/${NIL_UUID}`,
      setup: () => stub.getJob.mockRejectedValue(new UpstreamNotFoundError('missing')),
      status: 404,
    },
    {
      label: 'an upstream outage',
      url: '/api/jobs',
      setup: () => stub.listJobs.mockRejectedValue(new UpstreamUnavailableError('down')),
      status: 502,
    },
    {
      label: 'an invalid upstream response',
      url: '/api/jobs',
      setup: () => stub.listJobs.mockRejectedValue(new UpstreamInvalidResponseError('bad')),
      status: 502,
    },
    {
      label: 'an upstream timeout',
      url: `/api/jobs/${JOB_ID}`,
      setup: () => stub.getJob.mockRejectedValue(new UpstreamTimeoutError('slow')),
      status: 504,
    },
    {
      label: 'an unexpected failure',
      url: '/api/jobs',
      setup: () => stub.listJobs.mockRejectedValue(new Error('bug')),
      status: 500,
    },
    { label: 'an unknown route', url: '/api/nope', status: 404 },
  ];

  it.each(failures)('marks $label ($status) as no-store', async ({ url, setup, status }) => {
    setup?.();
    const app = await appWith();

    const response = await app.inject({ method: 'GET', url });

    expect(response.statusCode).toBe(status);
    expect(response.headers['cache-control']).toBe('no-store');
  });
});

describe('API with the in-memory cache', () => {
  async function cachedApp(time: { now: number }, env: Record<string, string> = {}) {
    const config = loadConfig(env);
    const coopleClient = createCachedCoopleClient(stub, {
      listTtlMs: config.listCacheTtlMs,
      detailsTtlMs: config.detailsCacheTtlMs,
      now: () => time.now,
    });
    return buildApp({ config, coopleClient });
  }

  it('asks Coople once for repeated list requests, then again after the time-to-live', async () => {
    const time = { now: 0 };
    const app = await cachedApp(time);

    const first = await app.inject({ method: 'GET', url: '/api/jobs' });
    const second = await app.inject({ method: 'GET', url: '/api/jobs' });

    expect(second.json()).toEqual(first.json());
    expect(stub.listJobs).toHaveBeenCalledTimes(1);

    time.now = 60_000;
    await app.inject({ method: 'GET', url: '/api/jobs' });
    expect(stub.listJobs).toHaveBeenCalledTimes(2);
  });

  it('asks Coople once for repeated requests of the same job', async () => {
    const app = await cachedApp({ now: 0 });

    await app.inject({ method: 'GET', url: `/api/jobs/${JOB_ID}` });
    await app.inject({ method: 'GET', url: `/api/jobs/${JOB_ID}` });

    expect(stub.getJob).toHaveBeenCalledTimes(1);
  });

  it('keeps asking Coople while it fails, and serves normally once it recovers', async () => {
    const app = await cachedApp({ now: 0 });
    stub.listJobs.mockRejectedValueOnce(new UpstreamUnavailableError('down'));

    const failed = await app.inject({ method: 'GET', url: '/api/jobs' });
    const recovered = await app.inject({ method: 'GET', url: '/api/jobs' });

    expect(failed.statusCode).toBe(502);
    expect(recovered.statusCode).toBe(200);
    expect(stub.listJobs).toHaveBeenCalledTimes(2);
  });

  it('does not cache requests that are rejected before reaching Coople', async () => {
    const app = await cachedApp({ now: 0 });

    await app.inject({ method: 'GET', url: '/api/jobs?pageSize=999' });
    await app.inject({ method: 'GET', url: '/api/jobs/not-a-uuid' });

    expect(stub.listJobs).not.toHaveBeenCalled();
    expect(stub.getJob).not.toHaveBeenCalled();
  });

  it('asks Coople every time when caching is switched off', async () => {
    const app = await cachedApp({ now: 0 }, { CACHE_LIST_TTL_MS: '0' });

    await app.inject({ method: 'GET', url: '/api/jobs' });
    await app.inject({ method: 'GET', url: '/api/jobs' });

    expect(stub.listJobs).toHaveBeenCalledTimes(2);
  });
});
