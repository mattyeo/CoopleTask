import type { JobDetails, JobSummary, Page } from '@coople-jobs/shared';
import { request, type RequestOptions } from './apiClient';

export interface JobListParams {
  page: number;
  pageSize: number;
}

export function fetchJobs(
  { page, pageSize }: JobListParams,
  options?: RequestOptions,
): Promise<Page<JobSummary>> {
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return request<Page<JobSummary>>(`/api/jobs?${query.toString()}`, options);
}

export function fetchJob(id: string, options?: RequestOptions): Promise<JobDetails> {
  return request<JobDetails>(`/api/jobs/${encodeURIComponent(id)}`, options);
}
