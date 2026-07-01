import { Router } from 'express';
import {
  logActivity,
  getActivityByDate,
  getActivityHistory,
  getDashboardSummary,
} from '../controllers/activityController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { logActivitySchema } from '../validators/activityValidator.js';

const router = Router();

router.post('/', protect, validate(logActivitySchema), logActivity);
router.get('/date/:date', protect, getActivityByDate);
router.get('/history', protect, getActivityHistory);
router.get('/dashboard', protect, getDashboardSummary);

export default router;
