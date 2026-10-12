import type { JobDetails, JobSummary, Page } from '@coople-jobs/shared';
import {
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import { fetchJob } from '../../api/jobsApi';
import { jobQueryKeys } from './jobQueryKeys';

/**
 * Returns the job details. While they load, the data is a placeholder built from the list cache
 * (when the job was opened from the list), so the title shows instantly. Check `isPlaceholderData`
 * before rendering the fields that only the details endpoint provides.
 */
export function useJob(id: string) {
  const queryClient = useQueryClient();

  return useQuery<JobDetails>({
    queryKey: jobQueryKeys.detail(id),
    queryFn: ({ signal }) => fetchJob(id, { signal }),
    placeholderData: () => {
      const summary = findCachedSummary(queryClient, id);
      return summary ? toPlaceholderDetails(summary) : undefined;
    },
  });
}

/** Looks the job up in every loaded page of every cached job list. */
export function findCachedSummary(queryClient: QueryClient, id: string): JobSummary | undefined {
  const lists = queryClient.getQueriesData<InfiniteData<Page<JobSummary>>>({
    queryKey: jobQueryKeys.lists(),
  });

  for (const [, list] of lists) {
    for (const page of list?.pages ?? []) {
      const match = page.items.find((job) => job.id === id);
      if (match) return match;
    }
  }
  return undefined;
}

export function toPlaceholderDetails(summary: JobSummary): JobDetails {
  return {
    ...summary,
    description: null,
    dressCode: null,
    endsAt: null,
    firstShiftEndsAt: null,
    shiftCount: null,
    totalWorkMinutes: null,
  };
}
