import type { JobSummary, Page } from '@coople-jobs/shared';

/** The next page to request, or undefined when the last loaded page was the final one. */
export function getNextPageNumber(lastPage: Page<JobSummary>): number | undefined {
  return lastPage.hasNextPage ? lastPage.page + 1 : undefined;
}

/**
 * Joins the loaded pages into one list. The job list is live: when jobs are published or removed
 * between two page requests, the same job can show up in two pages. Keeping only the first
 * occurrence guarantees unique list keys.
 */
export function mergePages(pages: Page<JobSummary>[]): JobSummary[] {
  const seen = new Set<string>();
  const jobs: JobSummary[] = [];

  for (const page of pages) {
    for (const job of page.items) {
      if (seen.has(job.id)) continue;
      seen.add(job.id);
      jobs.push(job);
    }
  }

  return jobs;
}
