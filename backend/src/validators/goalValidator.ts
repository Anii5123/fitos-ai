import { z } from 'zod';

export const createGoalSchema = z.object({
  body: z.object({
    targetWeight: z.number({ required_error: 'Target weight is required' }).positive(),
    targetCalories: z.number({ required_error: 'Target calories is required' }).positive(),
    proteinGoal: z.number({ required_error: 'Protein goal is required' }).positive(),
    carbsGoal: z.number().nonnegative().optional(),
    fatGoal: z.number().nonnegative().optional(),
    waterGoal: z.number({ required_error: 'Water intake goal is required' }).positive(),
    dailyStepGoal: z.number({ required_error: 'Daily steps goal is required' }).positive(),
    targetDate: z.string({ required_error: 'Target deadline is required' }).transform((val) => new Date(val)),
  }),
});
