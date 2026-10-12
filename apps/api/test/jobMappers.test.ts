import type { JobDetails, JobSummary } from '@coople-jobs/shared';
import { describe, expect, it } from 'vitest';
import {
  coopleJobDetailsSchema,
  coopleJobListSchema,
  type CoopleJobDetailsDto,
  type CoopleJobSummaryDto,
} from '../src/coople/coopleSchemas';
import { toJobDetails, toJobSummary } from '../src/jobs/jobMappers';
import detailsFixture from './fixtures/details.json';
import listFixture from './fixtures/list.json';

const [summaryDto, summaryWithStateDto] = coopleJobListSchema.parse(listFixture.data).items as [
  CoopleJobSummaryDto,
  CoopleJobSummaryDto,
];
const detailsDto = coopleJobDetailsSchema.parse(detailsFixture.data);

function withDetails(overrides: Partial<CoopleJobDetailsDto>): CoopleJobDetailsDto {
  return { ...detailsDto, ...overrides };
}

describe('toJobSummary', () => {
  it('renames upstream fields to the domain language', () => {
    const summary: JobSummary = toJobSummary(summaryDto);

    expect(summary).toEqual({
      id: '2c92cf2f-5073-4842-bedd-580e3a8feea9',
      referenceNumber: '60261055776',
      title: 'AllrounderIn / BetriebsmitarbeiterIn',
      hourlyWage: { amount: 27, currency: 'CHF' },
      totalPay: { amount: 445.5, currency: 'CHF' },
      location: { street: null, zip: '6343', city: 'Rotkreuz ZG', countryCode: 'CH' },
      startsAt: '2026-10-12T04:00:00.000Z',
      publishedAt: '2026-10-08T15:22:09.000Z',
      appLink: 'https://coople.app.link/DV6KNlsy46b',
    });
  });

  it('does not leak opaque upstream fields into the domain model', () => {
    const summary = toJobSummary(summaryWithStateDto);

    expect(summary).not.toHaveProperty('jobSkill');
    expect(summary).not.toHaveProperty('workAssignmentId');
    expect(summary.location).not.toHaveProperty('state');
  });

  it('converts epoch milliseconds to ISO 8601', () => {
    const summary = toJobSummary({ ...summaryDto, periodFrom: 0, datePublished: 1_000 });

    expect(summary.startsAt).toBe('1970-01-01T00:00:00.000Z');
    expect(summary.publishedAt).toBe('1970-01-01T00:00:01.000Z');
  });

  it('maps unknown currency ids to a null currency and keeps the amount', () => {
    const summary = toJobSummary({
      ...summaryDto,
      hourlyWage: { amount: 12.5, currencyId: 999 },
      salary: { amount: 100, currencyId: 999 },
    });

    expect(summary.hourlyWage).toEqual({ amount: 12.5, currency: null });
    expect(summary.totalPay).toEqual({ amount: 100, currency: null });
  });

  it('maps unknown country ids to a null country code', () => {
    const summary = toJobSummary({
      ...summaryDto,
      jobLocation: { ...summaryDto.jobLocation, countryId: 999 },
    });

    expect(summary.location.countryCode).toBeNull();
  });

  it('maps empty and blank strings to null', () => {
    const summary = toJobSummary({
      ...summaryDto,
      jobLocation: { ...summaryDto.jobLocation, addressStreet: '   ' },
      branchLink: '',
    });

    expect(summary.location.street).toBeNull();
    expect(summary.appLink).toBeNull();
  });

  it('keeps a real street and trims it', () => {
    const summary = toJobSummary({
      ...summaryDto,
      jobLocation: { ...summaryDto.jobLocation, addressStreet: ' Bahnhofstrasse 1 ' },
    });

    expect(summary.location.street).toBe('Bahnhofstrasse 1');
  });

  it('maps a missing or null app link to null', () => {
    expect(toJobSummary({ ...summaryDto, branchLink: undefined }).appLink).toBeNull();
    expect(toJobSummary({ ...summaryDto, branchLink: null }).appLink).toBeNull();
  });
});

describe('toJobDetails', () => {
  it('maps every details field to the domain language', () => {
    const details: JobDetails = toJobDetails(detailsDto);

    expect(details).toMatchObject({
      id: '2c92cf2f-5073-4842-bedd-580e3a8feea9',
      title: 'AllrounderIn / BetriebsmitarbeiterIn',
      dressCode: 'T-Shirt und Schürze werden vom Arbeitgeber gestellt',
      endsAt: '2026-10-14T13:00:00.000Z',
      firstShiftEndsAt: '2026-10-12T13:00:00.000Z',
      shiftCount: 2,
      totalWorkMinutes: 990,
    });
    expect(details.description).toContain('**Aufgaben:**');
    expect(details.description).toContain('- Abwasch und Reinigung des Geschirrs');
  });

  it('includes everything from the summary mapping', () => {
    const { description, dressCode, endsAt, firstShiftEndsAt, shiftCount, totalWorkMinutes } =
      toJobDetails(detailsDto);
    const summaryFields = toJobSummary(detailsDto);

    expect(toJobDetails(detailsDto)).toEqual({
      ...summaryFields,
      description,
      dressCode,
      endsAt,
      firstShiftEndsAt,
      shiftCount,
      totalWorkMinutes,
    });
  });

  it('maps missing optional fields to null, never undefined', () => {
    const details = toJobDetails(
      withDetails({
        requirements: undefined,
        clothingRequirements: undefined,
        periodTo: undefined,
        firstShiftTo: undefined,
        shiftsCount: undefined,
        workDuration: undefined,
      }),
    );

    expect(details.description).toBeNull();
    expect(details.dressCode).toBeNull();
    expect(details.endsAt).toBeNull();
    expect(details.firstShiftEndsAt).toBeNull();
    expect(details.shiftCount).toBeNull();
    expect(details.totalWorkMinutes).toBeNull();
  });

  it('maps null and blank optional text to null', () => {
    const details = toJobDetails(
      withDetails({ requirements: '  \n ', clothingRequirements: null }),
    );

    expect(details.description).toBeNull();
    expect(details.dressCode).toBeNull();
  });

  it('keeps zero values instead of treating them as missing', () => {
    const details = toJobDetails(withDetails({ shiftsCount: 0, workDuration: 0 }));

    expect(details.shiftCount).toBe(0);
    expect(details.totalWorkMinutes).toBe(0);
  });
});
