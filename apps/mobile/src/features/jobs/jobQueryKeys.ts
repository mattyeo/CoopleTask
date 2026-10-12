import type { JobListParams } from '../../api/jobsApi';

const all = ['jobs'] as const;

export const jobQueryKeys = {
  all,
  lists: () => [...all, 'list'] as const,
  list: (params: JobListParams) => [...all, 'list', params] as const,
  detail: (id: string) => [...all, 'detail', id] as const,
};
