import { describe, expect, it, vi } from 'vitest';
import { createCoopleClient } from '../../src/coople/coopleClient';
import {
  UpstreamInvalidResponseError,
  UpstreamNotFoundError,
  UpstreamTimeoutError,
  UpstreamUnavailableError,
} from '../../src/coople/coopleErrors';
import detailsFixture from '../fixtures/details.json';
import listFixture from '../fixtures/list.json';
import notFoundFixture from '../fixtures/notFound.json';

const BASE_URL = 'https://coople.test/public-jobs';
const JOB_ID = '2c92cf2f-5073-4842-bedd-580e3a8feea9';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function clientWith(fetchStub: typeof fetch, timeoutMs = 1000) {
  return createCoopleClient({ baseUrl: BASE_URL, timeoutMs, fetch: fetchStub });
}

function stubFetch(response: Response | (() => Response)) {
  return vi.fn<typeof fetch>(async () => (typeof response === 'function' ? response() : response));
}

describe('coopleClient.listJobs', () => {
  it('returns the unwrapped, validated list data', async () => {
    const fetchStub = stubFetch(jsonResponse(listFixture));

    const result = await clientWith(fetchStub).listJobs(0, 30);

    expect(result.total).toBe(650);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      workAssignmentId: JOB_ID,
      workAssignmentName: 'AllrounderIn / BetriebsmitarbeiterIn',
      hourlyWage: { amount: 27, currencyId: 1 },
    });
    expect(fetchStub.mock.calls[0]?.[0]).toBe(`${BASE_URL}/list?pageNum=0&pageSize=30`);
  });

  it('strips unknown upstream fields instead of rejecting them', async () => {
    const body = structuredClone(listFixture);
    Object.assign(body.data.items[0]!, { brandNewField: 'surprise' });

    const result = await clientWith(stubFetch(jsonResponse(body))).listJobs(0, 30);

    expect(result.items[0]).not.toHaveProperty('brandNewField');
  });

  it('does not treat a 404 on the list endpoint as a missing job', async () => {
    const client = clientWith(stubFetch(jsonResponse(notFoundFixture, 404)));

    await expect(client.listJobs(0, 30)).rejects.toBeInstanceOf(UpstreamUnavailableError);
  });
});

describe('coopleClient.getJob', () => {
  it('returns the unwrapped, validated job details', async () => {
    const fetchStub = stubFetch(jsonResponse(detailsFixture));

    const result = await clientWith(fetchStub).getJob(JOB_ID);

    expect(result).toMatchObject({
      workAssignmentId: JOB_ID,
      shiftsCount: 2,
      workDuration: 990,
      clothingRequirements: 'T-Shirt und Schürze werden vom Arbeitgeber gestellt',
    });
    expect(fetchStub.mock.calls[0]?.[0]).toBe(`${BASE_URL}/${JOB_ID}`);
  });

  it('accepts details without the optional fields', async () => {
    const { data } = detailsFixture;
    const body = {
      ...detailsFixture,
      data: {
        workAssignmentId: data.workAssignmentId,
        waReadableId: data.waReadableId,
        workAssignmentName: data.workAssignmentName,
        hourlyWage: data.hourlyWage,
        salary: data.salary,
        jobLocation: data.jobLocation,
        periodFrom: data.periodFrom,
        datePublished: data.datePublished,
      },
    };

    const result = await clientWith(stubFetch(jsonResponse(body))).getJob(JOB_ID);

    expect(result.requirements).toBeUndefined();
    expect(result.workDuration).toBeUndefined();
  });

  it('maps HTTP 404 with the Object_not_found envelope to UpstreamNotFoundError', async () => {
    const client = clientWith(stubFetch(jsonResponse(notFoundFixture, 404)));

    await expect(client.getJob(JOB_ID)).rejects.toBeInstanceOf(UpstreamNotFoundError);
  });

  it('maps an Object_not_found envelope delivered with HTTP 200 to UpstreamNotFoundError', async () => {
    const client = clientWith(stubFetch(jsonResponse(notFoundFixture, 200)));

    await expect(client.getJob(JOB_ID)).rejects.toBeInstanceOf(UpstreamNotFoundError);
  });
});

describe('coopleClient error handling', () => {
  it('maps HTTP 500 with a non-JSON body to UpstreamUnavailableError', async () => {
    const client = clientWith(stubFetch(new Response('Bad gateway', { status: 500 })));

    const error = await client.getJob(JOB_ID).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(UpstreamUnavailableError);
    expect((error as UpstreamUnavailableError).details.status).toBe(500);
  });

  it('maps HTTP 401 Authentication_error to UpstreamUnavailableError', async () => {
    const body = { status: 401, errorCode: 'Authentication_error', error: true };
    const client = clientWith(stubFetch(jsonResponse(body, 401)));

    await expect(client.getJob('not-a-uuid')).rejects.toBeInstanceOf(UpstreamUnavailableError);
  });

  it('treats an envelope with error: true as an error even when HTTP is 200', async () => {
    const body = { ...listFixture, error: true, errorCode: 'Internal_error' };
    const client = clientWith(stubFetch(jsonResponse(body, 200)));

    const error = await client.listJobs(0, 30).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(UpstreamUnavailableError);
    expect((error as UpstreamUnavailableError).details.errorCode).toBe('Internal_error');
  });

  it('maps a body that does not match the schema to UpstreamInvalidResponseError', async () => {
    const body = structuredClone(listFixture) as unknown as {
      data: { items: Array<Record<string, unknown>> };
    };
    delete body.data.items[0]!.workAssignmentName;
    const client = clientWith(stubFetch(jsonResponse(body)));

    const error = await client.listJobs(0, 30).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(UpstreamInvalidResponseError);
    expect((error as UpstreamInvalidResponseError).details.issues).toBeDefined();
  });

  it('rejects timestamps that cannot be represented as dates', async () => {
    const body = structuredClone(listFixture);
    body.data.items[0]!.periodFrom = 1e20;
    const client = clientWith(stubFetch(jsonResponse(body)));

    await expect(client.listJobs(0, 30)).rejects.toBeInstanceOf(UpstreamInvalidResponseError);
  });

  it('maps a successful response that is not an envelope to UpstreamInvalidResponseError', async () => {
    const client = clientWith(stubFetch(jsonResponse({ hello: 'world' })));

    await expect(client.listJobs(0, 30)).rejects.toBeInstanceOf(UpstreamInvalidResponseError);
  });

  it('maps a successful response with a non-JSON body to UpstreamInvalidResponseError', async () => {
    const client = clientWith(stubFetch(new Response('<html>oops</html>', { status: 200 })));

    await expect(client.listJobs(0, 30)).rejects.toBeInstanceOf(UpstreamInvalidResponseError);
  });

  it('maps a network failure to UpstreamUnavailableError', async () => {
    const fetchStub = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('fetch failed'));

    await expect(clientWith(fetchStub).listJobs(0, 30)).rejects.toBeInstanceOf(
      UpstreamUnavailableError,
    );
  });

  it('maps an upstream that is too slow to UpstreamTimeoutError', async () => {
    const neverAnswers = vi.fn<typeof fetch>(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
        }),
    );

    await expect(clientWith(neverAnswers, 20).listJobs(0, 30)).rejects.toBeInstanceOf(
      UpstreamTimeoutError,
    );
  });

  it('only ever throws typed upstream errors', async () => {
    const fetchStub = vi.fn<typeof fetch>().mockRejectedValue('not even an Error');

    const error = await clientWith(fetchStub)
      .getJob(JOB_ID)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(UpstreamUnavailableError);
  });

  it('logs the details of failures', async () => {
    const logger = { warn: vi.fn() };
    const client = createCoopleClient({
      baseUrl: BASE_URL,
      timeoutMs: 1000,
      fetch: stubFetch(new Response('boom', { status: 503 })),
      logger,
    });

    await client.listJobs(0, 30).catch(() => undefined);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ details: expect.objectContaining({ status: 503 }) }),
      expect.any(String),
    );
  });
});
