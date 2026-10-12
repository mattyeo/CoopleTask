import type { JobSummary, Page } from '@coople-jobs/shared';
import { QueryClient, type InfiniteData } from '@tanstack/react-query';
import { jobQueryKeys } from '@/features/jobs/api/jobQueryKeys';
import { findCachedSummary, toPlaceholderDetails } from '@/features/jobs/hooks/useJob';
import { makeJob, makeJobs, makePage } from '@/test-utils/jobFactories';

function infiniteData(...pages: Page<JobSummary>[]): InfiniteData<Page<JobSummary>> {
  return { pages, pageParams: pages.map((_, index) => index) };
}

let client: QueryClient;

beforeEach(() => {
  client = new QueryClient();
});

// Cached queries keep a garbage-collection timer alive, which would stop Jest from exiting.
afterEach(() => {
  client.clear();
});

describe('findCachedSummary', () => {
  it('finds a job on the first loaded page', () => {
    client.setQueryData(
      jobQueryKeys.list(30),
      infiniteData(makePage(0, makeJobs(3, 'a'), { total: 6, pageSize: 3 })),
    );

    expect(findCachedSummary(client, 'a-1')?.title).toBe('Job a-1');
  });

  it('finds a job on a page that was loaded by scrolling', () => {
    client.setQueryData(
      jobQueryKeys.list(30),
      infiniteData(
        makePage(0, makeJobs(3, 'a'), { total: 9, pageSize: 3 }),
        makePage(1, makeJobs(3, 'b'), { total: 9, pageSize: 3 }),
        makePage(2, makeJobs(3, 'c'), { total: 9, pageSize: 3 }),
      ),
    );

    expect(findCachedSummary(client, 'c-2')?.id).toBe('c-2');
  });

  it('searches every cached list, not only one page size', () => {
    client.setQueryData(
      jobQueryKeys.list(10),
      infiniteData(makePage(0, [makeJob('only-here')], { total: 1, pageSize: 10 })),
    );
    client.setQueryData(
      jobQueryKeys.list(30),
      infiniteData(makePage(0, makeJobs(2), { total: 2 })),
    );

    expect(findCachedSummary(client, 'only-here')).toBeDefined();
  });

  it('returns undefined when the job is not cached or nothing is cached', () => {
    expect(findCachedSummary(client, 'job-0')).toBeUndefined();

    client.setQueryData(
      jobQueryKeys.list(30),
      infiniteData(makePage(0, makeJobs(2), { total: 2 })),
    );

    expect(findCachedSummary(client, 'unknown')).toBeUndefined();
  });

  it('ignores cached job details, which are not lists', () => {
    client.setQueryData(jobQueryKeys.detail('job-9'), { id: 'job-9' });

    expect(findCachedSummary(client, 'job-9')).toBeUndefined();
  });
});

describe('toPlaceholderDetails', () => {
  it('keeps the summary and sets every details-only field to null', () => {
    const summary = makeJob('job-1');

    expect(toPlaceholderDetails(summary)).toEqual({
      ...summary,
      description: null,
      dressCode: null,
      endsAt: null,
      firstShiftEndsAt: null,
      shiftCount: null,
      totalWorkMinutes: null,
    });
  });
});
