import { z } from 'zod';

const FoodItemValidationSchema = z.object({
  name: z.string({ required_error: 'Food item name is required' }).min(1),
  quantity: z.string({ required_error: 'Portion size/quantity description is required' }).min(1),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  fiber: z.number().nonnegative().optional(),
  sugar: z.number().nonnegative().optional(),
  sodium: z.number().nonnegative().optional(),
});

export const createMealSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Meal category (e.g. Breakfast) is required' }),
    time: z.string({ required_error: 'Meal log time is required' }),
    date: z.string({ required_error: 'Meal date (YYYY-MM-DD) is required' }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    foodItems: z.array(FoodItemValidationSchema).min(1, 'At least one food item must be supplied in a meal log'),
    notes: z.string().optional(),
    images: z.array(z.string()).optional(), // array of MealImage object IDs
  }),
});

export const analyzeTextSchema = z.object({
  body: z.object({
    text: z.string({ required_error: 'Food description text is required' }).min(3, 'Description must be at least 3 characters long'),
  }),
});
