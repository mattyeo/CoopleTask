import { useQuery } from '@tanstack/react-query';
import { fetchJobs, type JobListParams } from '../../api/jobsApi';
import { jobQueryKeys } from './jobQueryKeys';

const FIRST_PAGE: JobListParams = { page: 0, pageSize: 30 };

export function useJobs() {
  return useQuery({
    queryKey: jobQueryKeys.list(FIRST_PAGE),
    queryFn: ({ signal }) => fetchJobs(FIRST_PAGE, { signal }),
  });
}
