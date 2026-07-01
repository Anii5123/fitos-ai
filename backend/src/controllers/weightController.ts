import { Request, Response, NextFunction } from 'express';
import { WeightHistory } from '../models/WeightHistory.js';
import { Goal } from '../models/Goal.js';
import { User } from '../models/User.js';
import { uploadImage } from '../services/storageService.js';
import { UnauthorizedError, NotFoundError, BadRequestError } from '../utils/errors.js';

export const logWeight = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();

    const { weight, date, measurements } = req.body;
    let progressPhotoUrl: string | undefined = undefined;
    let cloudinaryPublicId: string | undefined = undefined;

    if (req.file) {
      const storageResult = await uploadImage(req.file.buffer, req.file.originalname, 'progress_photos');
      progressPhotoUrl = storageResult.url;
      cloudinaryPublicId = storageResult.publicId;
    }

    const parsedMeasurements = measurements ? (typeof measurements === 'string' ? JSON.parse(measurements) : measurements) : undefined;

    const log = await WeightHistory.findOneAndUpdate(
      { userId: req.user.userId, date },
      {
        $set: {
          weight,
          ...(parsedMeasurements && { measurements: parsedMeasurements }),
          ...(progressPhotoUrl && { progressPhotoUrl, cloudinaryPublicId }),
        },
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      status: 'success',
      log,
    });
  } catch (error) {
    next(error);
  }
};

export const getWeightHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();

    const history = await WeightHistory.find({ userId: req.user.userId }).sort({ date: -1 });

    res.status(200).json({
      status: 'success',
      history,
    });
  } catch (error) {
    next(error);
  }
};

export const getWeightTrends = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const userId = req.user.userId;

    const logs = await WeightHistory.find({ userId }).sort({ date: 1 });
    const goal = await Goal.findOne({ userId, isActive: true });
    const user = await User.findById(userId);

    // Height in meters (fallback to 1.75m if not logged on user)
    const heightCm = (user as any)?.height || 175;
    const heightMeters = heightCm / 100;

    let currentBMI = 0;
    let startWeight = 0;
    let latestWeight = 0;
    let avgWeeklyLoss = 0;
    let predictedWeeks = 99; // Default if no loss rate can be established
    let targetWeight = goal?.targetWeight || 0;

    if (logs.length > 0) {
      latestWeight = logs[logs.length - 1].weight;
      startWeight = logs[0].weight;
      currentBMI = Math.round((latestWeight / (heightMeters * heightMeters)) * 10) / 10;

      // Calculate weekly loss rate if we have logs over time
      const firstLog = logs[0];
      const lastLog = logs[logs.length - 1];
      const diffTime = new Date(lastLog.date).getTime() - new Date(firstLog.date).getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 7) {
        const totalLoss = startWeight - latestWeight;
        const weeks = diffDays / 7;
        avgWeeklyLoss = Math.round((totalLoss / weeks) * 100) / 100;

        // Predict remaining weeks to target weight
        if (targetWeight > 0 && avgWeeklyLoss > 0 && latestWeight > targetWeight) {
          const weightLeft = latestWeight - targetWeight;
          predictedWeeks = Math.round((weightLeft / avgWeeklyLoss) * 10) / 10;
        } else if (targetWeight > 0 && avgWeeklyLoss < 0 && latestWeight < targetWeight) {
          // Weight gain scenario
          const weightLeft = targetWeight - latestWeight;
          predictedWeeks = Math.round((weightLeft / Math.abs(avgWeeklyLoss)) * 10) / 10;
        }
      }
    }

    res.status(200).json({
      status: 'success',
      trends: {
        currentBMI,
        startWeight,
        latestWeight,
        targetWeight,
        avgWeeklyLoss,
        predictedWeeks: predictedWeeks === 99 ? 'Need at least 7 days of logs to establish loss rate' : predictedWeeks,
        totalLoss: Math.round((startWeight - latestWeight) * 10) / 10,
        logsCount: logs.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
