import { Request, Response, NextFunction } from 'express';
import { DailyActivity } from '../models/DailyActivity.js';
import { DailyNutrition } from '../models/DailyNutrition.js';
import { Meal } from '../models/Meal.js';
import { Goal } from '../models/Goal.js';
import { WeightHistory } from '../models/WeightHistory.js';
import { AIInsight } from '../models/AIInsight.js';
import { UnauthorizedError, BadRequestError } from '../utils/errors.js';

export const logActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();

    const {
      date,
      stepsWalked,
      caloriesBurned,
      exerciseDuration,
      sleepHours,
      workoutType,
      mood,
      energyLevel,
      waterIntake,
    } = req.body;

    // Create or update DailyActivity
    const activity = await DailyActivity.findOneAndUpdate(
      { userId: req.user.userId, date },
      {
        $set: {
          ...(stepsWalked !== undefined && { stepsWalked }),
          ...(caloriesBurned !== undefined && { caloriesBurned }),
          ...(exerciseDuration !== undefined && { exerciseDuration }),
          ...(sleepHours !== undefined && { sleepHours }),
          ...(workoutType !== undefined && { workoutType }),
          ...(mood !== undefined && { mood }),
          ...(energyLevel !== undefined && { energyLevel }),
        },
      },
      { upsert: true, new: true }
    );

    // Sync waterIntake to DailyNutrition collection if provided
    if (waterIntake !== undefined) {
      await DailyNutrition.findOneAndUpdate(
        { userId: req.user.userId, date },
        { $set: { waterIntake } },
        { upsert: true }
      );
    }

    res.status(200).json({
      status: 'success',
      activity,
    });
  } catch (error) {
    next(error);
  }
};

export const getActivityByDate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const { date } = req.params;

    const activity = await DailyActivity.findOne({ userId: req.user.userId, date });
    const nutrition = await DailyNutrition.findOne({ userId: req.user.userId, date });

    res.status(200).json({
      status: 'success',
      activity: activity || null,
      waterIntake: nutrition?.waterIntake || 0,
    });
  } catch (error) {
    next(error);
  }
};

export const getActivityHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();

    const { startDate, endDate } = req.query;
    const query: Record<string, any> = { userId: req.user.userId };

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const activities = await DailyActivity.find(query).sort({ date: -1 });

    res.status(200).json({
      status: 'success',
      activities,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();

    const todayStr = new Date().toISOString().split('T')[0];
    const userId = req.user.userId;

    // Fetch goals
    const goal = await Goal.findOne({ userId, isActive: true });
    
    // Fetch today's activity
    const activity = await DailyActivity.findOne({ userId, date: todayStr });
    
    // Fetch today's nutrition cache
    const nutrition = await DailyNutrition.findOne({ userId, date: todayStr });
    
    // Fetch today's meals list
    const meals = await Meal.find({ userId, date: todayStr }).populate('images');
    
    // Fetch recent meals overall
    const recentMeals = await Meal.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('images');

    // Fetch weight trend (last 7 logs)
    const weightTrend = await WeightHistory.find({ userId })
      .sort({ date: -1 })
      .limit(7);

    // Latest logged weight
    const latestWeightLog = await WeightHistory.findOne({ userId }).sort({ date: -1 });

    // AI Daily Suggestion / Insight
    const latestInsight = await AIInsight.findOne({ userId, type: 'daily' }).sort({ date: -1 });

    // Calculate days remaining toward goal target date
    let daysRemaining = 0;
    let progressPercentage = 0;
    if (goal) {
      const now = new Date();
      const target = new Date(goal.targetDate);
      const diffTime = target.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      // progress check using user weight logs
      if (latestWeightLog && goal.targetWeight !== latestWeightLog.weight) {
        // Find starting weight: first logged weight
        const startingWeightLog = await WeightHistory.findOne({ userId }).sort({ date: 1 });
        if (startingWeightLog) {
          const totalDistance = startingWeightLog.weight - goal.targetWeight;
          const currentDistance = latestWeightLog.weight - goal.targetWeight;
          
          if (totalDistance > 0) {
            progressPercentage = Math.round(Math.max(0, Math.min(100, ((totalDistance - currentDistance) / totalDistance) * 100)));
          } else {
            // weight gain goal case
            progressPercentage = Math.round(Math.max(0, Math.min(100, ((currentDistance - totalDistance) / -totalDistance) * 100)));
          }
        }
      }
    }

    res.status(200).json({
      status: 'success',
      summary: {
        nutrition: {
          caloriesConsumed: nutrition?.caloriesConsumed || 0,
          caloriesRemaining: goal ? Math.max(0, goal.targetCalories - (nutrition?.caloriesConsumed || 0)) : 2000,
          protein: nutrition?.proteinConsumed || 0,
          carbs: nutrition?.carbsConsumed || 0,
          fat: nutrition?.fatConsumed || 0,
          fiber: nutrition?.fiberConsumed || 0,
          waterIntake: nutrition?.waterIntake || 0,
        },
        activity: {
          stepsWalked: activity?.stepsWalked || 0,
          caloriesBurned: activity?.caloriesBurned || 0,
          sleepHours: activity?.sleepHours || 0,
        },
        weight: {
          currentWeight: latestWeightLog?.weight || null,
          goalWeight: goal?.targetWeight || null,
          daysRemaining,
          progressPercentage,
        },
        goals: goal || null,
        mealsToday: meals,
        recentMeals,
        weightTrend: weightTrend.reverse(),
        aiSuggestion: latestInsight || null,
      },
    });
  } catch (error) {
    next(error);
  }
};
