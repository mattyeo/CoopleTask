import { QueryClient } from '@tanstack/react-query';
import { isRetryable } from './ApiError';

export const MAX_RETRIES = 2;

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  return isRetryable(error) && failureCount < MAX_RETRIES;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});
