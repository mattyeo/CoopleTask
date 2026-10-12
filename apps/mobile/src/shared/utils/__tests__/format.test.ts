import { formatDateTime, formatDuration, formatMoney } from '@/shared/utils/format';

// Intl separates currency and number with a (narrow) no-break space; compare with a plain one.
function normaliseSpaces(value: string): string {
  return value.replace(/\s/g, ' ');
}

describe('formatMoney', () => {
  it('formats a known currency in Swiss style', () => {
    expect(normaliseSpaces(formatMoney({ amount: 27, currency: 'CHF' }))).toBe('CHF 27.00');
    expect(normaliseSpaces(formatMoney({ amount: 445.5, currency: 'CHF' }))).toBe('CHF 445.50');
  });

  it('falls back to the plain number when the currency is unknown', () => {
    expect(formatMoney({ amount: 27, currency: null })).toBe('27.00');
    expect(formatMoney({ amount: 12.5, currency: null })).toBe('12.50');
  });

  it('falls back to the plain number when the currency code is not valid', () => {
    expect(formatMoney({ amount: 27, currency: 'not-a-currency' })).toBe('27.00');
  });
});

describe('formatDateTime', () => {
  it('shows summer time in Zurich (UTC+2)', () => {
    expect(formatDateTime('2026-10-12T04:00:00.000Z')).toBe('12.10.2026, 06:00');
  });

  it('shows winter time in Zurich (UTC+1)', () => {
    expect(formatDateTime('2026-12-01T10:00:00.000Z')).toBe('01.12.2026, 11:00');
  });

  it('uses the Zurich calendar day, not the UTC day', () => {
    expect(formatDateTime('2026-10-11T22:30:00.000Z')).toBe('12.10.2026, 00:30');
  });

  it('returns null instead of "Invalid Date"', () => {
    expect(formatDateTime(null)).toBeNull();
    expect(formatDateTime('')).toBeNull();
    expect(formatDateTime('not a date')).toBeNull();
  });
});

describe('formatDuration', () => {
  it('formats hours and minutes', () => {
    expect(formatDuration(990)).toBe('16 h 30 min');
    expect(formatDuration(61)).toBe('1 h 1 min');
  });

  it('omits the zero part', () => {
    expect(formatDuration(60)).toBe('1 h');
    expect(formatDuration(480)).toBe('8 h');
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(0)).toBe('0 min');
  });

  it('rounds fractional minutes', () => {
    expect(formatDuration(59.6)).toBe('1 h');
    expect(formatDuration(30.4)).toBe('30 min');
  });

  it('returns null for missing or unusable values', () => {
    expect(formatDuration(null)).toBeNull();
    expect(formatDuration(-5)).toBeNull();
    expect(formatDuration(Number.NaN)).toBeNull();
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBeNull();
  });
});
