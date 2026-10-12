export interface Money {
  amount: number;
  /** ISO 4217 code, or null if the upstream currency id is unknown */
  currency: string | null;
}

export interface JobLocation {
  street: string | null;
  zip: string;
  city: string;
  /** ISO 3166-1 alpha-2 code, or null if the upstream country id is unknown */
  countryCode: string | null;
}

export interface JobSummary {
  id: string;
  referenceNumber: string;
  title: string;
  hourlyWage: Money;
  totalPay: Money;
  location: JobLocation;
  /** ISO 8601 */
  startsAt: string;
  /** ISO 8601 */
  publishedAt: string;
  appLink: string | null;
}

export interface JobDetails extends JobSummary {
  description: string | null;
  dressCode: string | null;
  /** ISO 8601 */
  endsAt: string | null;
  /** ISO 8601 */
  firstShiftEndsAt: string | null;
  shiftCount: number | null;
  totalWorkMinutes: number | null;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
}

export const API_ERROR_CODES = [
  'INVALID_REQUEST',
  'INVALID_JOB_ID',
  'JOB_NOT_FOUND',
  'UPSTREAM_UNAVAILABLE',
  'UPSTREAM_TIMEOUT',
  'UPSTREAM_INVALID_RESPONSE',
  'INTERNAL_ERROR',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string };
}
