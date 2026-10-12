import { ApiError, type ApiClientErrorCode } from '@/shared/api/ApiError';

export const ERROR_MESSAGES: Record<ApiClientErrorCode, string> = {
  NETWORK_ERROR: "We can't reach the server. Check your connection and try again.",
  UPSTREAM_UNAVAILABLE: 'The jobs service is temporarily unavailable. Please try again.',
  UPSTREAM_TIMEOUT: 'The jobs service took too long to answer. Please try again.',
  UPSTREAM_INVALID_RESPONSE: "The jobs service sent data we couldn't read. Please try again later.",
  JOB_NOT_FOUND: 'This job no longer exists.',
  INVALID_JOB_ID: 'This link is not valid.',
  INVALID_REQUEST: 'Something was wrong with the request.',
  INTERNAL_ERROR: 'Something went wrong on our side. Please try again later.',
};

export function getErrorMessage(error: unknown): string {
  const code = error instanceof ApiError ? error.code : 'INTERNAL_ERROR';
  return ERROR_MESSAGES[code];
}
