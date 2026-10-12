import { QueryClient } from '@tanstack/react-query';
import { fetchJobs } from '../../../api/jobsApi';
import { jobQueryKeys } from '../jobQueryKeys';
import { PAGE_SIZE, jobsInfiniteQueryOptions } from '../useJobs';
import { makeJobs, makePage } from '../../../testing/jobFactories';

jest.mock('../../../api/jobsApi');

const fetchJobsMock = jest.mocked(fetchJobs);

function serveTotal(total: number): void {
  fetchJobsMock.mockImplementation(async ({ page, pageSize }) => {
    const first = page * pageSize;
    const count = Math.max(0, Math.min(pageSize, total - first));
    return makePage(page, makeJobs(count, `p${page}`), { total, pageSize });
  });
}

let client: QueryClient;

beforeEach(() => {
  fetchJobsMock.mockReset();
  client = new QueryClient();
});

// Cached queries keep a garbage-collection timer alive, which would stop Jest from exiting.
afterEach(() => {
  client.clear();
});

describe('jobsInfiniteQueryOptions', () => {
  it('starts with the first page', async () => {
    serveTotal(100);

    const data = await client.fetchInfiniteQuery({ ...jobsInfiniteQueryOptions, pages: 1 });

    expect(fetchJobsMock).toHaveBeenCalledTimes(1);
    expect(fetchJobsMock.mock.calls[0]?.[0]).toEqual({ page: 0, pageSize: PAGE_SIZE });
    expect(data.pages).toHaveLength(1);
  });

  it('requests the following pages one after another', async () => {
    serveTotal(100);

    const data = await client.fetchInfiniteQuery({ ...jobsInfiniteQueryOptions, pages: 3 });

    expect(fetchJobsMock.mock.calls.map(([params]) => params.page)).toEqual([0, 1, 2]);
    expect(data.pages.map((page) => page.page)).toEqual([0, 1, 2]);
  });

  it('stops after the last page even when more pages are requested', async () => {
    serveTotal(40);

    const data = await client.fetchInfiniteQuery({ ...jobsInfiniteQueryOptions, pages: 5 });

    expect(fetchJobsMock).toHaveBeenCalledTimes(2);
    expect(data.pages.map((page) => page.items.length)).toEqual([30, 10]);
  });

  it('keeps the cache under the key that the details placeholder searches', async () => {
    serveTotal(10);

    await client.fetchInfiniteQuery({ ...jobsInfiniteQueryOptions, pages: 1 });

    expect(client.getQueriesData({ queryKey: jobQueryKeys.lists() })).toHaveLength(1);
  });

  it('passes the abort signal on so a request can be cancelled', async () => {
    serveTotal(10);

    await client.fetchInfiniteQuery({ ...jobsInfiniteQueryOptions, pages: 1 });

    expect(fetchJobsMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });
});
