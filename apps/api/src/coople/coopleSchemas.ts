import { z } from 'zod';

// Unknown extra keys are stripped (default z.object behaviour), so upstream adding a field never
// breaks us. Optional upstream fields are `nullish` because the API may omit or null them.

export const OBJECT_NOT_FOUND_ERROR_CODE = 'Object_not_found';

export const coopleEnvelopeSchema = z.object({
  status: z.number(),
  errorCode: z.string(),
  error: z.boolean(),
  data: z.unknown().optional(),
});

const coopleMoneySchema = z.object({
  amount: z.number(),
  currencyId: z.number(),
});

const coopleLocationSchema = z.object({
  addressStreet: z.string().nullish(),
  zip: z.string(),
  city: z.string(),
  countryId: z.number(),
});

export const coopleJobSummarySchema = z.object({
  workAssignmentId: z.string(),
  waReadableId: z.string(),
  workAssignmentName: z.string(),
  hourlyWage: coopleMoneySchema,
  salary: coopleMoneySchema,
  jobLocation: coopleLocationSchema,
  periodFrom: z.number(),
  datePublished: z.number(),
  branchLink: z.string().nullish(),
});

export const coopleJobDetailsSchema = coopleJobSummarySchema.extend({
  requirements: z.string().nullish(),
  clothingRequirements: z.string().nullish(),
  periodTo: z.number().nullish(),
  firstShiftTo: z.number().nullish(),
  shiftsCount: z.number().nullish(),
  workDuration: z.number().nullish(),
});

export const coopleJobListSchema = z.object({
  items: z.array(coopleJobSummarySchema),
  total: z.number(),
});

export type CoopleJobSummaryDto = z.infer<typeof coopleJobSummarySchema>;
export type CoopleJobDetailsDto = z.infer<typeof coopleJobDetailsSchema>;
export type CoopleJobListDto = z.infer<typeof coopleJobListSchema>;
