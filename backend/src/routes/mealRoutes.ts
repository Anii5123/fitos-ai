import { Router } from 'express';
import {
  createMeal,
  getMealsByDate,
  getMealsHistory,
  deleteMeal,
  analyzeText,
  uploadScanImage,
} from '../controllers/mealController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';
import { createMealSchema, analyzeTextSchema } from '../validators/mealValidator.js';

const router = Router();

router.post('/', protect, validate(createMealSchema), createMeal);
router.get('/date/:date', protect, getMealsByDate);
router.get('/history', protect, getMealsHistory);
router.delete('/:id', protect, deleteMeal);
router.post('/analyze-text', protect, validate(analyzeTextSchema), analyzeText);
router.post('/scan', protect, upload.single('image'), uploadScanImage);

export default router;
