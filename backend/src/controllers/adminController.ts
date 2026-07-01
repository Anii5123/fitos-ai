import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { Meal } from '../models/Meal.js';
import { Goal } from '../models/Goal.js';
import { DailyActivity } from '../models/DailyActivity.js';
import { WeeklyReport } from '../models/WeeklyReport.js';
import { MonthlyReport } from '../models/MonthlyReport.js';
import { UnauthorizedError, NotFoundError, BadRequestError } from '../utils/errors.js';

export const getSystemStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMeals = await Meal.countDocuments();
    const totalGoals = await Goal.countDocuments();
    const totalActivities = await DailyActivity.countDocuments();
    const totalWeekly = await WeeklyReport.countDocuments();
    const totalMonthly = await MonthlyReport.countDocuments();

    // Fetch recent users
    const recentUsers = await User.find()
      .select('-password -refreshTokens')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      status: 'success',
      stats: {
        totalUsers,
        totalMeals,
        totalGoals,
        totalActivities,
        totalWeekly,
        totalMonthly,
      },
      recentUsers,
    });
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password -refreshTokens')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.status(200).json({
      status: 'success',
      users,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const changeUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      throw new BadRequestError('Invalid role role specification');
    }

    // Do not allow self demotion
    if (req.user && req.user.userId === id) {
      throw new BadRequestError('Administrators cannot change their own roles');
    }

    const user = await User.findById(id);
    if (!user) throw new NotFoundError('User not found');

    user.role = role;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: `User role has been updated to ${role}.`,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (req.user && req.user.userId === id) {
      throw new BadRequestError('Administrators cannot delete their own accounts');
    }

    const user = await User.findById(id);
    if (!user) throw new NotFoundError('User not found');

    // Wipe user data
    await Meal.deleteMany({ userId: id });
    await Goal.deleteMany({ userId: id });
    await DailyActivity.deleteMany({ userId: id });
    await WeeklyReport.deleteMany({ userId: id });
    await MonthlyReport.deleteMany({ userId: id });
    await user.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'User account and all related metric history deleted.',
    });
  } catch (error) {
    next(error);
  }
};
