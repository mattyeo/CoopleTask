import type { JobSummary } from '@coople-jobs/shared';

export type ListEntry =
  { kind: 'job'; key: string; job: JobSummary } | { kind: 'filler'; key: string };

/**
 * Pads the jobs with invisible filler entries so the last row of a multi-column grid is full.
 * Without them, the cards of an incomplete last row would stretch wider than all the others.
 */
export function toListEntries(jobs: JobSummary[], columns: number): ListEntry[] {
  const entries: ListEntry[] = jobs.map((job) => ({ kind: 'job', key: job.id, job }));

  const remainder = jobs.length % columns;
  if (columns > 1 && remainder !== 0) {
    for (let index = 0; index < columns - remainder; index += 1) {
      entries.push({ kind: 'filler', key: `filler-${index}` });
    }
  }

  return entries;
}
