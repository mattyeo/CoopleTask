import type { JobSummary, Page } from '@coople-jobs/shared';

export function makeJob(id: string): JobSummary {
  return {
    id,
    referenceNumber: id,
    title: `Job ${id}`,
    hourlyWage: { amount: 25, currency: 'CHF' },
    totalPay: { amount: 200, currency: 'CHF' },
    location: { street: null, zip: '8000', city: 'Zürich', countryCode: 'CH' },
    startsAt: '2026-10-12T04:00:00.000Z',
    publishedAt: '2026-10-08T15:22:09.000Z',
    appLink: null,
  };
}

export function makeJobs(count: number, prefix = 'job'): JobSummary[] {
  return Array.from({ length: count }, (_, index) => makeJob(`${prefix}-${index}`));
}

export function makePage(
  page: number,
  items: JobSummary[],
  options: { total: number; pageSize?: number },
): Page<JobSummary> {
  const pageSize = options.pageSize ?? 30;
  return {
    items,
    page,
    pageSize,
    total: options.total,
    hasNextPage: (page + 1) * pageSize < options.total,
  };
}
