import { toListEntries } from '@/features/jobs/utils/listLayout';
import { makeJobs } from '@/test-utils/jobFactories';

function kinds(count: number, columns: number): string[] {
  return toListEntries(makeJobs(count), columns).map((entry) => entry.kind);
}

describe('toListEntries', () => {
  it('adds no fillers in a single column', () => {
    expect(kinds(5, 1)).toEqual(['job', 'job', 'job', 'job', 'job']);
  });

  it('adds no fillers when the last row is already full', () => {
    expect(kinds(4, 2)).toEqual(['job', 'job', 'job', 'job']);
    expect(kinds(6, 3)).toHaveLength(6);
  });

  it('completes an incomplete last row with fillers', () => {
    expect(kinds(3, 2)).toEqual(['job', 'job', 'job', 'filler']);
    expect(kinds(4, 3)).toEqual(['job', 'job', 'job', 'job', 'filler', 'filler']);
    expect(kinds(5, 3)).toEqual(['job', 'job', 'job', 'job', 'job', 'filler']);
  });

  it('always produces a multiple of the column count', () => {
    for (let columns = 1; columns <= 3; columns += 1) {
      for (let count = 0; count <= 10; count += 1) {
        expect(toListEntries(makeJobs(count), columns).length % columns).toBe(0);
      }
    }
  });

  it('keeps the jobs in order and uses unique keys', () => {
    const entries = toListEntries(makeJobs(4), 3);
    const keys = entries.map((entry) => entry.key);

    expect(keys).toEqual(['job-0', 'job-1', 'job-2', 'job-3', 'filler-0', 'filler-1']);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('returns nothing for an empty list', () => {
    expect(toListEntries([], 3)).toEqual([]);
  });
});
