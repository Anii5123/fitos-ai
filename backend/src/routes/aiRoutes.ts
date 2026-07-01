import { Router } from 'express';
import {
  getCoachInsights,
  triggerDailySummary,
  chatWithCoach,
  generateWeeklyReport,
  generateMonthlyReport,
  downloadMonthlyPDF,
} from '../controllers/aiController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/insights', protect, getCoachInsights);
router.post('/daily-summary', protect, triggerDailySummary);
router.post('/chat', protect, chatWithCoach);
router.post('/weekly-report', protect, generateWeeklyReport);
router.post('/monthly-report', protect, generateMonthlyReport);
router.get('/monthly-pdf/:id', protect, downloadMonthlyPDF);

export default router;
