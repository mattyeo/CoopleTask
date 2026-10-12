import type { ApiErrorCode, JobDetails, Page, JobSummary } from '@coople-jobs/shared';
import type { FastifyInstance } from 'fastify';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app';
import { loadConfig } from '../../src/config';
import {
  UpstreamInvalidResponseError,
  UpstreamNotFoundError,
  UpstreamTimeoutError,
  UpstreamUnavailableError,
} from '../../src/coople/coopleErrors';
import { coopleJobDetailsSchema, coopleJobListSchema } from '../../src/coople/coopleSchemas';
import detailsFixture from '../fixtures/details.json';
import listFixture from '../fixtures/list.json';
import { createStubCoopleClient } from '../helpers/stubCoopleClient';

const JOB_ID = '2c92cf2f-5073-4842-bedd-580e3a8feea9';
const NIL_UUID = '00000000-0000-0000-0000-000000000000';

const listDto = coopleJobListSchema.parse(listFixture.data);
const detailsDto = coopleJobDetailsSchema.parse(detailsFixture.data);

let client: ReturnType<typeof createStubCoopleClient>;
let app: FastifyInstance;

beforeEach(async () => {
  client = createStubCoopleClient();
  app = await buildApp({ config: loadConfig({}), coopleClient: client });
});

function expectError(
  response: { statusCode: number; json: () => unknown },
  statusCode: number,
  code: ApiErrorCode,
) {
  expect(response.statusCode).toBe(statusCode);
  expect(response.json()).toEqual({ error: { code, message: expect.any(String) } });
}

describe('GET /api/jobs', () => {
  it('returns a normalised page of job summaries', async () => {
    client.listJobs.mockResolvedValue(listDto);

    const response = await app.inject({ method: 'GET', url: '/api/jobs' });

    expect(response.statusCode).toBe(200);
    const body = response.json<Page<JobSummary>>();
    expect(body).toMatchObject({ page: 0, pageSize: 30, total: 650, hasNextPage: true });
    expect(body.items).toHaveLength(2);
    expect(body.items[0]).toMatchObject({
      id: JOB_ID,
      title: 'AllrounderIn / BetriebsmitarbeiterIn',
      hourlyWage: { amount: 27, currency: 'CHF' },
      location: { street: null, zip: '6343', city: 'Rotkreuz ZG', countryCode: 'CH' },
    });
    expect(client.listJobs).toHaveBeenCalledWith(0, 30);
  });

  it('passes page and pageSize on to the upstream client', async () => {
    client.listJobs.mockResolvedValue(listDto);

    await app.inject({ method: 'GET', url: '/api/jobs?page=3&pageSize=10' });

    expect(client.listJobs).toHaveBeenCalledWith(3, 10);
  });

  it('computes hasNextPage from the total', async () => {
    client.listJobs.mockResolvedValue({ items: listDto.items, total: 20 });

    const lastPage = await app.inject({ method: 'GET', url: '/api/jobs?page=1&pageSize=10' });
    const middlePage = await app.inject({ method: 'GET', url: '/api/jobs?page=0&pageSize=10' });

    expect(lastPage.json<Page<JobSummary>>().hasNextPage).toBe(false);
    expect(middlePage.json<Page<JobSummary>>().hasNextPage).toBe(true);
  });

  it('returns an empty page, not an error, when paging past the end', async () => {
    client.listJobs.mockResolvedValue({ items: [], total: 650 });

    const response = await app.inject({ method: 'GET', url: '/api/jobs?page=999' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ items: [], total: 650, hasNextPage: false });
  });

  it.each([
    'pageSize=0',
    'pageSize=51',
    'pageSize=abc',
    'pageSize=1.5',
    'page=-1',
    'page=abc',
    'page=1.5',
  ])('rejects invalid query "%s" without calling upstream', async (query) => {
    const response = await app.inject({ method: 'GET', url: `/api/jobs?${query}` });

    expectError(response, 400, 'INVALID_REQUEST');
    expect(client.listJobs).not.toHaveBeenCalled();
  });

  it('maps an unavailable upstream to 502 UPSTREAM_UNAVAILABLE', async () => {
    client.listJobs.mockRejectedValue(new UpstreamUnavailableError('down'));

    expectError(await app.inject({ method: 'GET', url: '/api/jobs' }), 502, 'UPSTREAM_UNAVAILABLE');
  });

  it('maps an upstream timeout to 504 UPSTREAM_TIMEOUT', async () => {
    client.listJobs.mockRejectedValue(new UpstreamTimeoutError('slow'));

    expectError(await app.inject({ method: 'GET', url: '/api/jobs' }), 504, 'UPSTREAM_TIMEOUT');
  });

  it('maps an unexpected upstream payload to 502 UPSTREAM_INVALID_RESPONSE', async () => {
    client.listJobs.mockRejectedValue(new UpstreamInvalidResponseError('bad shape'));

    expectError(
      await app.inject({ method: 'GET', url: '/api/jobs' }),
      502,
      'UPSTREAM_INVALID_RESPONSE',
    );
  });

  it('answers 500 INTERNAL_ERROR without leaking the cause of unexpected failures', async () => {
    client.listJobs.mockRejectedValue(new Error('secret database password'));

    const response = await app.inject({ method: 'GET', url: '/api/jobs' });

    expectError(response, 500, 'INTERNAL_ERROR');
    expect(response.body).not.toContain('secret');
  });
});

describe('GET /api/jobs/:id', () => {
  it('returns the normalised job details', async () => {
    client.getJob.mockResolvedValue(detailsDto);

    const response = await app.inject({ method: 'GET', url: `/api/jobs/${JOB_ID}` });

    expect(response.statusCode).toBe(200);
    expect(response.json<JobDetails>()).toMatchObject({
      id: JOB_ID,
      referenceNumber: '60261055776',
      dressCode: 'T-Shirt und Schürze werden vom Arbeitgeber gestellt',
      endsAt: '2026-10-14T13:00:00.000Z',
      shiftCount: 2,
      totalWorkMinutes: 990,
    });
    expect(client.getJob).toHaveBeenCalledWith(JOB_ID);
  });

  it.each(['not-a-uuid', '12345', '2c92cf2f-5073-4842-bedd-580e3a8feea9x'])(
    'rejects the malformed id "%s" with 400 INVALID_JOB_ID without calling upstream',
    async (id) => {
      const response = await app.inject({ method: 'GET', url: `/api/jobs/${id}` });

      expectError(response, 400, 'INVALID_JOB_ID');
      expect(client.getJob).not.toHaveBeenCalled();
    },
  );

  it('forwards a well-formed id that does not exist and answers 404 JOB_NOT_FOUND', async () => {
    client.getJob.mockRejectedValue(new UpstreamNotFoundError('missing'));

    const response = await app.inject({ method: 'GET', url: `/api/jobs/${NIL_UUID}` });

    expectError(response, 404, 'JOB_NOT_FOUND');
    expect(client.getJob).toHaveBeenCalledWith(NIL_UUID);
  });

  it('maps an unavailable upstream to 502 UPSTREAM_UNAVAILABLE', async () => {
    client.getJob.mockRejectedValue(new UpstreamUnavailableError('down'));

    expectError(
      await app.inject({ method: 'GET', url: `/api/jobs/${JOB_ID}` }),
      502,
      'UPSTREAM_UNAVAILABLE',
    );
  });

  it('maps an upstream timeout to 504 UPSTREAM_TIMEOUT', async () => {
    client.getJob.mockRejectedValue(new UpstreamTimeoutError('slow'));

    expectError(
      await app.inject({ method: 'GET', url: `/api/jobs/${JOB_ID}` }),
      504,
      'UPSTREAM_TIMEOUT',
    );
  });

  it('maps an unexpected upstream payload to 502 UPSTREAM_INVALID_RESPONSE', async () => {
    client.getJob.mockRejectedValue(new UpstreamInvalidResponseError('bad shape'));

    expectError(
      await app.inject({ method: 'GET', url: `/api/jobs/${JOB_ID}` }),
      502,
      'UPSTREAM_INVALID_RESPONSE',
    );
  });
});
