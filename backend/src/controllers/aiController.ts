import { Request, Response, NextFunction } from 'express';
import { AIInsight } from '../models/AIInsight.js';
import { Meal } from '../models/Meal.js';
import { DailyActivity } from '../models/DailyActivity.js';
import { WeightHistory } from '../models/WeightHistory.js';
import { Goal } from '../models/Goal.js';
import { User } from '../models/User.js';
import { WeeklyReport } from '../models/WeeklyReport.js';
import { MonthlyReport } from '../models/MonthlyReport.js';
import { Notification } from '../models/Notification.js';
import { DailyNutrition } from '../models/DailyNutrition.js';
import {
  generateDailySummary,
  generateWeeklyReportAI,
  generateMonthlyReportAI,
} from '../services/aiService.js';
import { generateMonthlyReportPDF } from '../services/pdfService.js';
import { UnauthorizedError, BadRequestError, NotFoundError } from '../utils/errors.js';
import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';

export const getCoachInsights = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    
    const insights = await AIInsight.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      status: 'success',
      insights,
    });
  } catch (error) {
    next(error);
  }
};

export const triggerDailySummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const userId = req.user.userId;
    const { date } = req.body;

    if (!date) throw new BadRequestError('Date is required');

    // Gather logs for date
    const meals = await Meal.find({ userId, date });
    const activity = await DailyActivity.findOne({ userId, date });
    const goal = await Goal.findOne({ userId, isActive: true });

    if (meals.length === 0 && !activity) {
      throw new BadRequestError('Cannot generate summary. No meals or activities logged on this date.');
    }

    // Call AI coach summary logic
    const summaryData = await generateDailySummary(goal, meals, activity, date);

    // Save to AIInsight
    const insight = await AIInsight.findOneAndUpdate(
      { userId, date, type: 'daily' },
      {
        $set: {
          summary: summaryData.summary,
          actionPoints: summaryData.actionPoints,
          suggestions: summaryData.suggestions,
        },
      },
      { upsert: true, new: true }
    );

    // Add smart notifications
    await Notification.create({
      userId,
      title: 'Daily AI Coach Review Ready!',
      message: `Your coach summary for ${date} has been updated. Review action plans.`,
      type: 'info',
      metadata: { date, insightId: insight._id },
    });

    res.status(200).json({
      status: 'success',
      insight,
    });
  } catch (error) {
    next(error);
  }
};

export const chatWithCoach = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const { message, history } = req.body; // history = array of { role: 'user' | 'model', text: string }

    if (!message) throw new BadRequestError('Message content is required');

    const userId = req.user.userId;
    const user = await User.findById(userId);
    const goal = await Goal.findOne({ userId, isActive: true });
    const latestWeight = await WeightHistory.findOne({ userId }).sort({ date: -1 });

    const systemPrompt = `
      You are an elite, encouraging personal fitness trainer and clinical dietitian coach named "FitTrack AI Coach".
      Your user's name is "${user?.name || 'User'}".
      ${goal ? `User's Goals: Calories: ${goal.targetCalories}kcal, Protein: ${goal.proteinGoal}g, Target Weight: ${goal.targetWeight}kg.` : ''}
      ${latestWeight ? `User's Current Weight: ${latestWeight.weight}kg.` : ''}
      
      Respond to the user's question directly with motivating, science-based suggestions. Limit answers to 3 short paragraphs. Be friendly, structured, and empathetic.
    `;

    if (env.GEMINI_API_KEY) {
      const aiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
      
      // Adapt user chat format to Gemini API chat formats if needed
      // For simplicity, we concatenate histories into a prompt wrapper or use chat structure
      const prompt = `
        System context: ${systemPrompt}
        
        Recent chat history:
        ${JSON.stringify(history || [])}
        
        New user message: "${message}"
        
        FitTrack AI Coach Response:
      `;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      res.status(200).json({
        status: 'success',
        reply: response.text || 'I am processing your training metrics. Let me know if you have any questions!',
      });
    } else {
      // Mock chat coach fallback
      let reply = `That is a great question regarding your training! As your AI Coach, I suggest maintaining a consistent caloric deficit while aiming to hit ${goal?.proteinGoal || 130}g of protein daily. Let me know if you would like me to analyze a specific meal or recommend high-protein snacks!`;
      const lower = message.toLowerCase();
      if (lower.includes('recipe') || lower.includes('cook') || lower.includes('eat')) {
        reply = "Here is a quick high-protein meal recommendation: 150g grilled chicken breast or pan-seared paneer cubes, paired with 1 cup of steamed white rice and a large bowl of green salad. This gives you about 45g of protein and is very low in fats!";
      } else if (lower.includes('cardio') || lower.includes('run') || lower.includes('workout') || lower.includes('steps')) {
        reply = `To hit your target weight of ${goal?.targetWeight || 'your target'} kg, I highly recommend aiming for your ${goal?.dailyStepGoal || 10000} steps daily step target, and doing 3 session of resistance training per week to maintain lean mass.`;
      }

      res.status(200).json({
        status: 'success',
        reply,
      });
    }
  } catch (error) {
    next(error);
  }
};

export const generateWeeklyReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const userId = req.user.userId;
    const { startDate, endDate } = req.body; // YYYY-MM-DD

    if (!startDate || !endDate) {
      throw new BadRequestError('startDate and endDate ranges are required');
    }

    // Get goals
    const goal = await Goal.findOne({ userId, isActive: true });

    // Find meals, activities, weight logs within range
    const meals = await Meal.find({ userId, date: { $gte: startDate, $lte: endDate } });
    const activities = await DailyActivity.find({ userId, date: { $gte: startDate, $lte: endDate } });
    const weights = await WeightHistory.find({ userId, date: { $gte: startDate, $lte: endDate } }).sort({ date: 1 });

    if (meals.length === 0 && activities.length === 0) {
      throw new BadRequestError('Insufficient logging history in this weekly range to compile a report.');
    }

    // Process high/low statistics
    const avgCal = meals.length > 0 ? Math.round(meals.reduce((acc, m) => acc + m.calories, 0) / 7) : 0;
    const avgProt = meals.length > 0 ? Math.round(meals.reduce((acc, m) => acc + m.protein, 0) / 7) : 0;
    const avgSteps = activities.length > 0 ? Math.round(activities.reduce((acc, a) => acc + a.stepsWalked, 0) / 7) : 0;

    let highestCalorieDay = { date: 'N/A', calories: 0 };
    let lowestProteinDay = { date: 'N/A', protein: 9999 };

    meals.forEach(m => {
      if (m.calories > highestCalorieDay.calories) {
        highestCalorieDay = { date: m.date, calories: m.calories };
      }
      if (m.protein < lowestProteinDay.protein) {
        lowestProteinDay = { date: m.date, protein: m.protein };
      }
    });

    if (lowestProteinDay.protein === 9999) lowestProteinDay.protein = 0;

    const startWeight = weights.length > 0 ? weights[0].weight : 0;
    const endWeight = weights.length > 0 ? weights[weights.length - 1].weight : 0;
    const weightChange = Math.round((endWeight - startWeight) * 10) / 10;

    // AI compilation
    const aiResult = await generateWeeklyReportAI(goal, meals, activities, weights);

    const report = new WeeklyReport({
      userId,
      startDate,
      endDate,
      averageCalories: avgCal,
      averageProtein: avgProt,
      averageSteps: avgSteps,
      highestCalorieDay,
      lowestProteinDay,
      weightChange,
      predictedFatLoss: aiResult.predictedFatLoss,
      aiSummary: aiResult.summary,
      suggestions: aiResult.suggestions,
    });

    await report.save();

    await Notification.create({
      userId,
      title: 'Weekly AI Report Released!',
      message: `Your weekly transformation review for ${startDate} to ${endDate} is ready.`,
      type: 'success',
      metadata: { reportId: report._id, startDate, endDate },
    });

    res.status(201).json({
      status: 'success',
      report,
    });
  } catch (error) {
    next(error);
  }
};

export const generateMonthlyReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const userId = req.user.userId;
    const { month } = req.body; // YYYY-MM e.g. "2026-06"

    if (!month) throw new BadRequestError('Month parameter (YYYY-MM) is required');

    // Aggregate logs matching the month
    const startStr = `${month}-01`;
    const endStr = `${month}-31`; // mongo handles string sorting fine

    const goal = await Goal.findOne({ userId, isActive: true });
    const user = await User.findById(userId);

    const meals = await Meal.find({ userId, date: { $gte: startStr, $lte: endStr } });
    const activities = await DailyActivity.find({ userId, date: { $gte: startStr, $lte: endStr } });
    const weights = await WeightHistory.find({ userId, date: { $gte: startStr, $lte: endStr } }).sort({ date: 1 });

    if (meals.length === 0 && activities.length === 0) {
      throw new BadRequestError('Insufficient logging data to compile a monthly report.');
    }

    // Averages
    const avgCal = meals.length > 0 ? Math.round(meals.reduce((acc, m) => acc + m.calories, 0) / 30) : 0;
    const avgProt = meals.length > 0 ? Math.round(meals.reduce((acc, m) => acc + m.protein, 0) / 30) : 0;
    const avgSteps = activities.length > 0 ? Math.round(activities.reduce((acc, a) => acc + a.stepsWalked, 0) / 30) : 0;

    // Weight and BMI changes
    const startWeight = weights.length > 0 ? weights[0].weight : 0;
    const endWeight = weights.length > 0 ? weights[weights.length - 1].weight : 0;
    const weightChange = Math.round((endWeight - startWeight) * 10) / 10;

    const heightCm = (user as any)?.height || 175;
    const heightM = heightCm / 100;
    const bmiStart = startWeight > 0 ? startWeight / (heightM * heightM) : 0;
    const bmiEnd = endWeight > 0 ? endWeight / (heightM * heightM) : 0;
    const bmiChange = Math.round((bmiEnd - bmiStart) * 10) / 10;

    // Cheat meals count: daily calorie logs that exceed target by 15%+
    let cheatMeals = 0;
    if (goal) {
      // Find daily nutrition logs matching range
      const dailyNuts = await DailyNutrition.find({ userId, date: { $gte: startStr, $lte: endStr } });
      cheatMeals = dailyNuts.filter(dn => dn.caloriesConsumed > goal.targetCalories * 1.15).length;
    }

    // Top foods aggregation
    const foodMap: Record<string, number> = {};
    meals.forEach(m => {
      m.foodItems.forEach(fi => {
        const item = fi.name.trim().toLowerCase();
        foodMap[item] = (foodMap[item] || 0) + 1;
      });
    });

    const topFoods = Object.entries(foodMap)
      .map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Compliance targets (days achieved / total logged days)
    let calorieCompliance = 0;
    let proteinCompliance = 0;
    let stepCompliance = 0;

    if (goal) {
      const dailyNuts = await DailyNutrition.find({ userId, date: { $gte: startStr, $lte: endStr } });
      const loggedDaysCount = dailyNuts.length || 1;
      
      const metCal = dailyNuts.filter(dn => dn.caloriesConsumed <= goal.targetCalories && dn.caloriesConsumed > 0).length;
      const metProt = dailyNuts.filter(dn => dn.proteinConsumed >= goal.proteinGoal).length;
      
      calorieCompliance = Math.round((metCal / loggedDaysCount) * 100);
      proteinCompliance = Math.round((metProt / loggedDaysCount) * 100);

      const activeDaysCount = activities.length || 1;
      const metSteps = activities.filter(a => a.stepsWalked >= goal.dailyStepGoal).length;
      stepCompliance = Math.round((metSteps / activeDaysCount) * 100);
    }

    // Call AI service
    const aiResult = await generateMonthlyReportAI(goal, meals, activities, weights);

    const report = new MonthlyReport({
      userId,
      month,
      averageCalories: avgCal,
      averageProtein: avgProt,
      averageSteps: avgSteps,
      weightChange,
      bmiChange,
      cheatMealsCount: cheatMeals,
      topFoodsConsumed: topFoods,
      complianceScores: {
        calorie: calorieCompliance || 75,
        protein: proteinCompliance || 60,
        activity: stepCompliance || 70,
      },
      aiSummary: aiResult.summary,
      suggestions: aiResult.suggestions,
    });

    await report.save();

    await Notification.create({
      userId,
      title: 'Monthly AI Report Completed!',
      message: `Your monthly progress digest for ${month} has been published. Download PDF.`,
      type: 'success',
      metadata: { reportId: report._id, month },
    });

    res.status(201).json({
      status: 'success',
      report,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadMonthlyPDF = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const { id } = req.params;

    const report = await MonthlyReport.findOne({ _id: id, userId: req.user.userId });
    if (!report) {
      throw new NotFoundError('Monthly report not found');
    }

    const user = await User.findById(req.user.userId);
    if (!user) throw new NotFoundError('User not found');

    const pdfBuffer = await generateMonthlyReportPDF(
      report,
      user.name || 'FitTrack AI User',
      user.email
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=FitTrack-Report-${report.month}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
