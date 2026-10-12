import type { JobDetails, JobSummary, Page } from '@coople-jobs/shared';

/** A job with every optional field filled in, shaped like a real Coople job. */
export function makeJobDetails(overrides: Partial<JobDetails> = {}): JobDetails {
  return {
    ...makeJob('job-1'),
    title: 'AllrounderIn / BetriebsmitarbeiterIn',
    referenceNumber: '60261055776',
    hourlyWage: { amount: 27, currency: 'CHF' },
    totalPay: { amount: 445.5, currency: 'CHF' },
    location: { street: 'Bahnhofstrasse 1', zip: '6343', city: 'Rotkreuz ZG', countryCode: 'CH' },
    appLink: 'https://coople.app.link/DV6KNlsy46b',
    description:
      'Die AG sucht einen Allrounder.\n**Aufgaben:**\n- Gemüse rüsten\n- Abwasch\n\n**Fähigkeiten:**\n- Pünktlichkeit',
    dressCode: 'T-Shirt und Schürze werden gestellt',
    endsAt: '2026-10-14T13:00:00.000Z',
    firstShiftEndsAt: '2026-10-12T13:00:00.000Z',
    shiftCount: 2,
    totalWorkMinutes: 990,
    ...overrides,
  };
}

/** The same job with everything that only the details endpoint provides removed. */
export function makeBareJobDetails(overrides: Partial<JobDetails> = {}): JobDetails {
  return makeJobDetails({
    location: { street: null, zip: '6343', city: 'Rotkreuz ZG', countryCode: null },
    appLink: null,
    description: null,
    dressCode: null,
    endsAt: null,
    firstShiftEndsAt: null,
    shiftCount: null,
    totalWorkMinutes: null,
    ...overrides,
  });
}

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
