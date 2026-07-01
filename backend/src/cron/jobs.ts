import cron from 'node-cron';
import { User } from '../models/User.js';
import { Meal } from '../models/Meal.js';
import { DailyActivity } from '../models/DailyActivity.js';
import { DailyNutrition } from '../models/DailyNutrition.js';
import { WeightHistory } from '../models/WeightHistory.js';
import { Notification } from '../models/Notification.js';
import { Goal } from '../models/Goal.js';
import { generateDailySummary } from '../services/aiService.js';
import { AIInsight } from '../models/AIInsight.js';

export const initCronJobs = (): void => {
  console.log('⏰ Initializing Background Cron Schedulers...');

  // 1. Morning Check-In (8:00 AM Daily)
  cron.schedule('0 8 * * *', async () => {
    try {
      console.log('⏰ Cron: Triggering Morning Reminders...');
      const users = await User.find({ isVerified: true });
      
      for (const user of users) {
        await Notification.create({
          userId: user._id,
          title: 'Good Morning! ☀️',
          message: 'Remember to weigh in and log your weight before breakfast to track consistency.',
          type: 'info',
        });
      }
    } catch (err) {
      console.error('❌ Morning Check-In Cron Error:', err);
    }
  });

  // 2. Missing Log Reminder (9:00 PM Daily)
  cron.schedule('0 21 * * *', async () => {
    try {
      console.log('⏰ Cron: Checking for missing logs...');
      const todayStr = new Date().toISOString().split('T')[0];
      const users = await User.find({ isVerified: true });

      for (const user of users) {
        const userId = user._id;

        // Check meals
        const mealsCount = await Meal.countDocuments({ userId, date: todayStr });
        // Check activity
        const activity = await DailyActivity.findOne({ userId, date: todayStr });
        // Check weight log
        const weight = await WeightHistory.findOne({ userId, date: todayStr });
        // Check water log
        const nutrition = await DailyNutrition.findOne({ userId, date: todayStr });

        const alerts: string[] = [];
        if (mealsCount === 0) alerts.push('meals');
        if (!weight) alerts.push('weight');
        if (!activity || activity.stepsWalked === 0) alerts.push('steps');
        if (!nutrition || nutrition.waterIntake === 0) alerts.push('water');

        if (alerts.length > 0) {
          await Notification.create({
            userId,
            title: 'Complete Your Daily Log! 📝',
            message: `You haven't logged your ${alerts.join(', ')} today. Fill them out to keep your streak!`,
            type: 'warning',
            metadata: { missing: alerts },
          });
        }
      }
    } catch (err) {
      console.error('❌ Missing Logs Cron Error:', err);
    }
  });

  // 3. Nightly AI Coach Summary (11:30 PM Daily)
  cron.schedule('30 23 * * *', async () => {
    try {
      console.log('⏰ Cron: Generating Nightly AI Coach Reviews...');
      const todayStr = new Date().toISOString().split('T')[0];
      const users = await User.find({ isVerified: true });

      for (const user of users) {
        const userId = user._id;

        const meals = await Meal.find({ userId, date: todayStr });
        const activity = await DailyActivity.findOne({ userId, date: todayStr });
        const goal = await Goal.findOne({ userId, isActive: true });

        // Skip if user logged absolutely nothing today
        if (meals.length === 0 && !activity) continue;

        try {
          const summaryData = await generateDailySummary(goal, meals, activity, todayStr);

          // Save insight
          const insight = await AIInsight.findOneAndUpdate(
            { userId, date: todayStr, type: 'daily' },
            {
              $set: {
                summary: summaryData.summary,
                actionPoints: summaryData.actionPoints,
                suggestions: summaryData.suggestions,
              },
            },
            { upsert: true, new: true }
          );

          // Create notification
          await Notification.create({
            userId,
            title: 'AI Daily Coach Summary Ready!',
            message: 'Your personal AI nutrition coach has reviewed your day. Click to check suggestions.',
            type: 'success',
            metadata: { date: todayStr, insightId: insight._id },
          });
        } catch (innerErr) {
          console.error(`❌ Failed to compile AI Coach nightly digest for user ${userId}:`, innerErr);
        }
      }
    } catch (err) {
      console.error('❌ Nightly AI Coach Cron Error:', err);
    }
  });
};
