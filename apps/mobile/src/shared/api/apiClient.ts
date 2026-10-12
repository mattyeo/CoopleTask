import { API_ERROR_CODES, type ApiErrorBody, type ApiErrorCode } from '@coople-jobs/shared';
import { config } from '@/shared/config';
import { ApiError } from './ApiError';

export interface RequestOptions {
  signal?: AbortSignal;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${config.apiUrl}${path}`, {
      headers: { accept: 'application/json' },
      signal: options.signal,
    });
  } catch (cause) {
    if (options.signal?.aborted) throw cause;
    throw new ApiError('NETWORK_ERROR', 'Could not reach the server', null, { cause });
  }

  if (!response.ok) throw await toApiError(response);

  try {
    return (await response.json()) as T;
  } catch (cause) {
    throw new ApiError(
      'INTERNAL_ERROR',
      'The server sent an unreadable response',
      response.status,
      {
        cause,
      },
    );
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => undefined);
  if (isApiErrorBody(body)) {
    return new ApiError(body.error.code, body.error.message, response.status);
  }
  return new ApiError(
    'INTERNAL_ERROR',
    `Unexpected server response (${response.status})`,
    response.status,
  );
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;
  const { error } = value;
  if (typeof error !== 'object' || error === null) return false;
  return (
    'code' in error &&
    'message' in error &&
    typeof error.message === 'string' &&
    isApiErrorCode(error.code)
  );
}

function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === 'string' && (API_ERROR_CODES as readonly string[]).includes(value);
}
