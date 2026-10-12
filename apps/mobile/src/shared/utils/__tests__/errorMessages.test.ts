import { API_ERROR_CODES } from '@coople-jobs/shared';
import { ApiError } from '@/shared/api/ApiError';
import { ERROR_MESSAGES, getErrorMessage } from '@/shared/utils/errorMessages';

describe('ERROR_MESSAGES', () => {
  it.each([...API_ERROR_CODES, 'NETWORK_ERROR' as const])('has a message for %s', (code) => {
    expect(ERROR_MESSAGES[code].length).toBeGreaterThan(0);
  });
});

describe('getErrorMessage', () => {
  it('uses the message of the error code', () => {
    const error = new ApiError('JOB_NOT_FOUND', 'raw server text', 404);

    expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.JOB_NOT_FOUND);
  });

  it('never shows raw server text', () => {
    const error = new ApiError('UPSTREAM_UNAVAILABLE', 'stack trace here', 502);

    expect(getErrorMessage(error)).not.toContain('stack trace');
  });

  it('uses the generic message for errors that are not ApiErrors', () => {
    expect(getErrorMessage(new Error('bug'))).toBe(ERROR_MESSAGES.INTERNAL_ERROR);
    expect(getErrorMessage('oops')).toBe(ERROR_MESSAGES.INTERNAL_ERROR);
    expect(getErrorMessage(undefined)).toBe(ERROR_MESSAGES.INTERNAL_ERROR);
  });
});
