import { Request, Response, NextFunction } from 'express';
import { Goal } from '../models/Goal.js';
import { UnauthorizedError, NotFoundError } from '../utils/errors.js';

export const createGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();

    const {
      targetWeight,
      targetCalories,
      proteinGoal,
      carbsGoal,
      fatGoal,
      waterGoal,
      dailyStepGoal,
      targetDate,
    } = req.body;

    const goal = new Goal({
      userId: req.user.userId,
      targetWeight,
      targetCalories,
      proteinGoal,
      carbsGoal: carbsGoal || Math.round((targetCalories * 0.4) / 4), // fallback default: 40% carbs
      fatGoal: fatGoal || Math.round((targetCalories * 0.3) / 9),    // fallback default: 30% fats
      waterGoal,
      dailyStepGoal,
      targetDate,
      isActive: true,
    });

    await goal.save();

    res.status(201).json({
      status: 'success',
      message: 'Goal established successfully.',
      goal,
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();

    const goal = await Goal.findOne({ userId: req.user.userId, isActive: true });
    
    res.status(200).json({
      status: 'success',
      goal: goal || null,
    });
  } catch (error) {
    next(error);
  }
};

export const getGoalsHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();

    const goals = await Goal.find({ userId: req.user.userId }).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      goals,
    });
  } catch (error) {
    next(error);
  }
};
