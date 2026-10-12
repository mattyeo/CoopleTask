import type { ApiErrorCode } from '@coople-jobs/shared';

export type ApiClientErrorCode = ApiErrorCode | 'NETWORK_ERROR';

export class ApiError extends Error {
  constructor(
    readonly code: ApiClientErrorCode,
    message: string,
    readonly status: number | null,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'ApiError';
  }
}

/** Network failures and 5xx answers may succeed on a retry; 4xx answers never will. */
export function isRetryable(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.code === 'NETWORK_ERROR') return true;
  return error.status !== null && error.status >= 500;
}
