import { getNextPageNumber, mergePages } from '../pagination';
import { makeJob, makeJobs, makePage } from '../../../testing/jobFactories';

describe('getNextPageNumber', () => {
  it('asks for the page after the last one while there are more', () => {
    expect(getNextPageNumber(makePage(0, makeJobs(30), { total: 100 }))).toBe(1);
    expect(getNextPageNumber(makePage(2, makeJobs(30), { total: 100 }))).toBe(3);
  });

  it('stops after the final page', () => {
    expect(getNextPageNumber(makePage(3, makeJobs(10), { total: 100 }))).toBeUndefined();
    expect(getNextPageNumber(makePage(0, makeJobs(5), { total: 5 }))).toBeUndefined();
  });

  it('stops when the total is an exact multiple of the page size', () => {
    expect(getNextPageNumber(makePage(1, makeJobs(30), { total: 60 }))).toBeUndefined();
  });
});

describe('mergePages', () => {
  it('joins the pages in order', () => {
    const pages = [
      makePage(0, makeJobs(2, 'a'), { total: 4, pageSize: 2 }),
      makePage(1, makeJobs(2, 'b'), { total: 4, pageSize: 2 }),
    ];

    expect(mergePages(pages).map((job) => job.id)).toEqual(['a-0', 'a-1', 'b-0', 'b-1']);
  });

  it('keeps only the first occurrence of a job that appears in two pages', () => {
    // A job published between the two requests pushes the last job of page 0 onto page 1.
    const pages = [
      makePage(0, [makeJob('x'), makeJob('y')], { total: 4, pageSize: 2 }),
      makePage(1, [makeJob('y'), makeJob('z')], { total: 4, pageSize: 2 }),
    ];

    const ids = mergePages(pages).map((job) => job.id);

    expect(ids).toEqual(['x', 'y', 'z']);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('returns nothing when there are no pages or only empty pages', () => {
    expect(mergePages([])).toEqual([]);
    expect(mergePages([makePage(0, [], { total: 0 })])).toEqual([]);
  });
});
