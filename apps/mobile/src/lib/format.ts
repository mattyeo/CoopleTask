import type { Money } from '@coople-jobs/shared';

const LOCALE = 'de-CH';
// Jobs are Swiss, so times are shown in Swiss time whatever timezone the viewer is in.
const TIME_ZONE = 'Europe/Zurich';

const plainNumberFormat = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: TIME_ZONE,
});

const currencyFormats = new Map<string, Intl.NumberFormat>();

function currencyFormat(currency: string): Intl.NumberFormat | null {
  const cached = currencyFormats.get(currency);
  if (cached) return cached;
  try {
    const format = new Intl.NumberFormat(LOCALE, { style: 'currency', currency });
    currencyFormats.set(currency, format);
    return format;
  } catch {
    // Not a valid ISO 4217 code
    return null;
  }
}

/** "CHF 27.00"; falls back to the plain number ("27.00") when the currency is unknown. */
export function formatMoney({ amount, currency }: Money): string {
  const format = currency ? currencyFormat(currency) : null;
  return (format ?? plainNumberFormat).format(amount);
}

/** "12.10.2026, 06:00" in Swiss time; null when there is no usable date. */
export function formatDateTime(iso: string | null): string | null {
  if (iso === null) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : dateTimeFormat.format(date);
}

/** 990 -> "16 h 30 min"; null when there is no usable duration. */
export function formatDuration(minutes: number | null): string | null {
  if (minutes === null || !Number.isFinite(minutes) || minutes < 0) return null;
  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
