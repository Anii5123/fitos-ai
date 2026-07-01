import { z } from 'zod';

export const logActivitySchema = z.object({
  body: z.object({
    date: z.string({ required_error: 'Log date is required' }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
    stepsWalked: z.number().nonnegative().optional(),
    caloriesBurned: z.number().nonnegative().optional(),
    exerciseDuration: z.number().nonnegative().optional(),
    sleepHours: z.number().nonnegative().optional(),
    workoutType: z.string().optional(),
    mood: z.string().optional(),
    energyLevel: z.number().min(1).max(10).optional(),
    waterIntake: z.number().nonnegative().optional(), // in ml
  }),
});
