import { Router } from 'express';
import { logWeight, getWeightHistory, getWeightTrends } from '../controllers/weightController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';
import { logWeightSchema } from '../validators/weightValidator.js';

const router = Router();

router.post('/', protect, upload.single('progressPhoto'), validate(logWeightSchema), logWeight);
router.get('/history', protect, getWeightHistory);
router.get('/trends', protect, getWeightTrends);

export default router;
