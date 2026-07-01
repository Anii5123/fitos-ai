import { z } from 'zod';

const MeasurementsValidationSchema = z.object({
  chest: z.number().positive().optional(),
  waist: z.number().positive().optional(),
  hips: z.number().positive().optional(),
  biceps: z.number().positive().optional(),
  thighs: z.number().positive().optional(),
});

export const logWeightSchema = z.object({
  body: z.object({
    weight: z.number({ required_error: 'Weight (kg) is required' }).positive(),
    date: z.string({ required_error: 'Date is required' }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
    measurements: MeasurementsValidationSchema.optional(),
  }),
});
