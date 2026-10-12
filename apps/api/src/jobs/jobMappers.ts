import type { JobDetails, JobLocation, JobSummary, Money } from '@coople-jobs/shared';
import type { CoopleJobDetailsDto, CoopleJobSummaryDto } from '../coople/coopleSchemas';

const CURRENCY_BY_ID: Record<number, string> = { 1: 'CHF' };
const COUNTRY_CODE_BY_ID: Record<number, string> = { 1: 'CH' };

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toIso(epochMs: number): string {
  return new Date(epochMs).toISOString();
}

function toIsoOrNull(epochMs: number | null | undefined): string | null {
  return epochMs == null ? null : toIso(epochMs);
}

function toMoney(dto: CoopleJobSummaryDto['hourlyWage']): Money {
  return { amount: dto.amount, currency: CURRENCY_BY_ID[dto.currencyId] ?? null };
}

function toLocation(dto: CoopleJobSummaryDto['jobLocation']): JobLocation {
  return {
    street: emptyToNull(dto.addressStreet),
    zip: dto.zip,
    city: dto.city,
    countryCode: COUNTRY_CODE_BY_ID[dto.countryId] ?? null,
  };
}

export function toJobSummary(dto: CoopleJobSummaryDto): JobSummary {
  return {
    id: dto.workAssignmentId,
    referenceNumber: dto.waReadableId,
    title: dto.workAssignmentName,
    hourlyWage: toMoney(dto.hourlyWage),
    totalPay: toMoney(dto.salary),
    location: toLocation(dto.jobLocation),
    startsAt: toIso(dto.periodFrom),
    publishedAt: toIso(dto.datePublished),
    appLink: emptyToNull(dto.branchLink),
  };
}

export function toJobDetails(dto: CoopleJobDetailsDto): JobDetails {
  return {
    ...toJobSummary(dto),
    description: emptyToNull(dto.requirements),
    dressCode: emptyToNull(dto.clothingRequirements),
    endsAt: toIsoOrNull(dto.periodTo),
    firstShiftEndsAt: toIsoOrNull(dto.firstShiftTo),
    shiftCount: dto.shiftsCount ?? null,
    totalWorkMinutes: dto.workDuration ?? null,
  };
}
