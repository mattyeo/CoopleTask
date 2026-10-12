import { beforeEach, describe, expect, it } from 'vitest';
import { createCachedCoopleClient } from '../src/coople/cachedCoopleClient';
import { UpstreamNotFoundError, UpstreamUnavailableError } from '../src/coople/coopleErrors';
import { coopleJobDetailsSchema, coopleJobListSchema } from '../src/coople/coopleSchemas';
import detailsFixture from './fixtures/details.json';
import listFixture from './fixtures/list.json';
import { createStubCoopleClient } from './stubCoopleClient';

const LIST_TTL = 60_000;
const DETAILS_TTL = 300_000;
const JOB_ID = '2c92cf2f-5073-4842-bedd-580e3a8feea9';

const listDto = coopleJobListSchema.parse(listFixture.data);
const detailsDto = coopleJobDetailsSchema.parse(detailsFixture.data);

let time: number;
let inner: ReturnType<typeof createStubCoopleClient>;

function build(options: { listTtlMs?: number; detailsTtlMs?: number } = {}) {
  return createCachedCoopleClient(inner, {
    listTtlMs: options.listTtlMs ?? LIST_TTL,
    detailsTtlMs: options.detailsTtlMs ?? DETAILS_TTL,
    now: () => time,
  });
}

beforeEach(() => {
  time = 0;
  inner = createStubCoopleClient();
  inner.listJobs.mockResolvedValue(listDto);
  inner.getJob.mockResolvedValue(detailsDto);
});

describe('listJobs', () => {
  it('asks the upstream once for repeated identical requests', async () => {
    const client = build();

    const first = await client.listJobs(0, 30);
    const second = await client.listJobs(0, 30);

    expect(second).toBe(first);
    expect(inner.listJobs).toHaveBeenCalledTimes(1);
  });

  it('caches every page and page size separately', async () => {
    const client = build();

    await client.listJobs(0, 30);
    await client.listJobs(1, 30);
    await client.listJobs(0, 10);

    expect(inner.listJobs.mock.calls).toEqual([
      [0, 30],
      [1, 30],
      [0, 10],
    ]);
  });

  it('does not mix up page / size pairs that read the same when joined', async () => {
    const client = build();

    await client.listJobs(1, 23);
    await client.listJobs(12, 3);

    expect(inner.listJobs).toHaveBeenCalledTimes(2);
  });

  it('shares one upstream call between concurrent identical requests', async () => {
    const client = build();

    await Promise.all([client.listJobs(0, 30), client.listJobs(0, 30), client.listJobs(0, 30)]);

    expect(inner.listJobs).toHaveBeenCalledTimes(1);
  });

  it('goes back to the upstream after the list time-to-live', async () => {
    const client = build();

    await client.listJobs(0, 30);
    time = LIST_TTL - 1;
    await client.listJobs(0, 30);
    expect(inner.listJobs).toHaveBeenCalledTimes(1);

    time = LIST_TTL;
    await client.listJobs(0, 30);
    expect(inner.listJobs).toHaveBeenCalledTimes(2);
  });
});

describe('getJob', () => {
  it('asks the upstream once for repeated requests of the same job', async () => {
    const client = build();

    await client.getJob(JOB_ID);
    await client.getJob(JOB_ID);

    expect(inner.getJob).toHaveBeenCalledTimes(1);
  });

  it('treats ids that differ only in letter case as the same job', async () => {
    const client = build();

    await client.getJob(JOB_ID);
    await client.getJob(JOB_ID.toUpperCase());

    expect(inner.getJob).toHaveBeenCalledTimes(1);
  });

  it('caches each job separately', async () => {
    const client = build();

    await client.getJob(JOB_ID);
    await client.getJob('e9bda8ea-e230-48b8-8241-563746b1debb');

    expect(inner.getJob).toHaveBeenCalledTimes(2);
  });

  it('keeps details longer than lists', async () => {
    const client = build();
    await client.listJobs(0, 30);
    await client.getJob(JOB_ID);

    time = LIST_TTL + 1_000;
    await client.listJobs(0, 30);
    await client.getJob(JOB_ID);

    expect(inner.listJobs).toHaveBeenCalledTimes(2);
    expect(inner.getJob).toHaveBeenCalledTimes(1);

    time = DETAILS_TTL;
    await client.getJob(JOB_ID);
    expect(inner.getJob).toHaveBeenCalledTimes(2);
  });
});

describe('failures', () => {
  it('does not cache "not found" and passes the original error on', async () => {
    const notFound = new UpstreamNotFoundError('missing');
    inner.getJob.mockRejectedValueOnce(notFound);
    const client = build();

    await expect(client.getJob(JOB_ID)).rejects.toBe(notFound);
    await expect(client.getJob(JOB_ID)).resolves.toBe(detailsDto);
    expect(inner.getJob).toHaveBeenCalledTimes(2);
  });

  it('does not cache an upstream outage, so recovery is immediate', async () => {
    inner.listJobs.mockRejectedValueOnce(new UpstreamUnavailableError('down'));
    const client = build();

    await expect(client.listJobs(0, 30)).rejects.toBeInstanceOf(UpstreamUnavailableError);
    await expect(client.listJobs(0, 30)).resolves.toBe(listDto);
  });
});

describe('switching the cache off', () => {
  it('asks the upstream every time when the time-to-live is 0', async () => {
    const client = build({ listTtlMs: 0, detailsTtlMs: 0 });

    await client.listJobs(0, 30);
    await client.listJobs(0, 30);
    await client.getJob(JOB_ID);
    await client.getJob(JOB_ID);

    expect(inner.listJobs).toHaveBeenCalledTimes(2);
    expect(inner.getJob).toHaveBeenCalledTimes(2);
  });

  it('can switch off only one of the two', async () => {
    const client = build({ listTtlMs: 0 });

    await client.listJobs(0, 30);
    await client.listJobs(0, 30);
    await client.getJob(JOB_ID);
    await client.getJob(JOB_ID);

    expect(inner.listJobs).toHaveBeenCalledTimes(2);
    expect(inner.getJob).toHaveBeenCalledTimes(1);
  });
});

describe('memory use', () => {
  it('stays bounded when a caller walks through very many pages', async () => {
    const client = createCachedCoopleClient(inner, {
      listTtlMs: LIST_TTL,
      detailsTtlMs: DETAILS_TTL,
      maxEntries: 3,
      now: () => time,
    });

    for (let page = 0; page < 10; page += 1) {
      await client.listJobs(page, 30);
    }
    // Page 0 was evicted long ago, so it has to be fetched again.
    await client.listJobs(0, 30);

    expect(inner.listJobs).toHaveBeenCalledTimes(11);
  });
});
