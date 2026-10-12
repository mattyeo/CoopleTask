import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query';
import { fetchJobs } from '@/features/jobs/api/jobsApi';
import { jobQueryKeys } from '@/features/jobs/api/jobQueryKeys';
import { getNextPageNumber } from '@/features/jobs/utils/pagination';

export const PAGE_SIZE = 30;

export const jobsInfiniteQueryOptions = infiniteQueryOptions({
  queryKey: jobQueryKeys.list(PAGE_SIZE),
  queryFn: ({ pageParam, signal }) =>
    fetchJobs({ page: pageParam, pageSize: PAGE_SIZE }, { signal }),
  initialPageParam: 0,
  getNextPageParam: getNextPageNumber,
});

export function useJobs() {
  return useInfiniteQuery(jobsInfiniteQueryOptions);
}
