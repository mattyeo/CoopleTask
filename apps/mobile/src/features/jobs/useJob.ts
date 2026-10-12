import type { JobDetails, JobSummary, Page } from '@coople-jobs/shared';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
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

function findCachedSummary(queryClient: QueryClient, id: string): JobSummary | undefined {
  const pages = queryClient.getQueriesData<Page<JobSummary>>({ queryKey: jobQueryKeys.lists() });
  for (const [, page] of pages) {
    const match = page?.items.find((job) => job.id === id);
    if (match) return match;
  }
  return undefined;
}

function toPlaceholderDetails(summary: JobSummary): JobDetails {
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
