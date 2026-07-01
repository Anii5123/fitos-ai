import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Meal, IMeal } from '../models/Meal.js';
import { MealImage } from '../models/MealImage.js';
import { DailyNutrition } from '../models/DailyNutrition.js';
import { Goal } from '../models/Goal.js';
import { Notification } from '../models/Notification.js';
import { uploadImage, deleteImage } from '../services/storageService.js';
import { analyzeMealText, analyzeMealImage } from '../services/aiService.js';
import { UnauthorizedError, BadRequestError, NotFoundError } from '../utils/errors.js';

/**
 * Recalculate and update the daily cache values for user analytics
 */
export const updateDailyNutritionCache = async (userId: string, date: string): Promise<void> => {
  const meals = await Meal.find({ userId, date });

  const totals = meals.reduce(
    (acc, meal) => {
      acc.calories += meal.calories;
      acc.protein += meal.protein;
      acc.carbs += meal.carbs;
      acc.fat += meal.fat;
      acc.fiber += meal.fiber;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  await DailyNutrition.findOneAndUpdate(
    { userId, date },
    {
      $set: {
        caloriesConsumed: Math.round(totals.calories),
        proteinConsumed: Math.round(totals.protein * 10) / 10,
        carbsConsumed: Math.round(totals.carbs * 10) / 10,
        fatConsumed: Math.round(totals.fat * 10) / 10,
        fiberConsumed: Math.round(totals.fiber * 10) / 10,
      },
    },
    { upsert: true, new: true }
  );

  // Check if calorie target was achieved and generate positive notification if so
  const goal = await Goal.findOne({ userId, isActive: true });
  if (goal) {
    if (totals.calories > 0 && totals.calories <= goal.targetCalories) {
      // Check if alert already sent for this date
      const existingAlert = await Notification.findOne({
        userId,
        type: 'success',
        title: 'Calorie Goal Maintained!',
        'metadata.date': date,
      });

      if (!existingAlert) {
        await Notification.create({
          userId,
          title: 'Calorie Goal Maintained!',
          message: `Great consistency! You remained within your daily target of ${goal.targetCalories} kcal today.`,
          type: 'success',
          metadata: { date },
        });
      }
    }
  }
};

export const createMeal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();

    const { name, time, date, foodItems, notes, images } = req.body;

    const meal = new Meal({
      userId: req.user.userId,
      name,
      time,
      date,
      foodItems,
      notes,
      images: images || [],
    });

    await meal.save();

    // Link images back to this meal
    if (images && images.length > 0) {
      await MealImage.updateMany(
        { _id: { $in: images } },
        { $set: { mealId: meal._id as mongoose.Types.ObjectId } }
      );
    }

    // Refresh aggregated totals for today
    await updateDailyNutritionCache(req.user.userId, date);

    res.status(201).json({
      status: 'success',
      meal,
    });
  } catch (error) {
    next(error);
  }
};

export const getMealsByDate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const { date } = req.params;

    const meals = await Meal.find({ userId: req.user.userId, date }).populate('images');

    res.status(200).json({
      status: 'success',
      meals,
    });
  } catch (error) {
    next(error);
  }
};

export const getMealsHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { userId: req.user.userId };

    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: req.query.startDate,
        $lte: req.query.endDate,
      };
    }

    if (req.query.name) {
      query.name = req.query.name;
    }

    const meals = await Meal.find(query)
      .sort({ date: -1, time: -1 })
      .skip(skip)
      .limit(limit)
      .populate('images');

    const total = await Meal.countDocuments(query);

    res.status(200).json({
      status: 'success',
      meals,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMeal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const { id } = req.params;

    const meal = await Meal.findOne({ _id: id, userId: req.user.userId });
    if (!meal) {
      throw new NotFoundError('Meal record not found');
    }

    // Clean up related images
    if (meal.images && meal.images.length > 0) {
      const images = await MealImage.find({ _id: { $in: meal.images } });
      for (const img of images) {
        if (img.cloudinaryPublicId) {
          await deleteImage(img.cloudinaryPublicId);
        }
        await img.deleteOne();
      }
    }

    const mealDate = meal.date;
    await meal.deleteOne();

    // Re-trigger cache recalculation
    await updateDailyNutritionCache(req.user.userId, mealDate);

    res.status(200).json({
      status: 'success',
      message: 'Meal log successfully deleted.',
    });
  } catch (error) {
    next(error);
  }
};

export const analyzeText = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body;
    const estimatedNutrition = await analyzeMealText(text);

    res.status(200).json({
      status: 'success',
      data: estimatedNutrition,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadScanImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();

    if (!req.file) {
      throw new BadRequestError('No image file provided');
    }

    // 1. Upload file using storage service
    const storageResult = await uploadImage(req.file.buffer, req.file.originalname, 'meals');

    // 2. Save image document in MongoDB
    const mealImage = new MealImage({
      userId: req.user.userId,
      imageUrl: storageResult.url,
      cloudinaryPublicId: storageResult.publicId,
    });
    await mealImage.save();

    // 3. Scan image buffer using LLM Multimodal service
    const aiPrediction = await analyzeMealImage(req.file.buffer, req.file.mimetype);

    res.status(200).json({
      status: 'success',
      image: {
        id: mealImage._id,
        url: mealImage.imageUrl,
      },
      prediction: aiPrediction,
    });
  } catch (error) {
    next(error);
  }
};
