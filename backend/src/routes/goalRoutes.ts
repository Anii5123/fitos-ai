import { Router } from 'express';
import { createGoal, getActiveGoal, getGoalsHistory } from '../controllers/goalController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { createGoalSchema } from '../validators/goalValidator.js';

const router = Router();

router.post('/', protect, validate(createGoalSchema), createGoal);
router.get('/active', protect, getActiveGoal);
router.get('/history', protect, getGoalsHistory);

export default router;
