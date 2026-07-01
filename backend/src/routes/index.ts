import { Router } from 'express';
import authRoutes from './authRoutes.js';
import goalRoutes from './goalRoutes.js';
import mealRoutes from './mealRoutes.js';
import activityRoutes from './activityRoutes.js';
import weightRoutes from './weightRoutes.js';
import aiRoutes from './aiRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/goals', goalRoutes);
router.use('/meals', mealRoutes);
router.use('/activities', activityRoutes);
router.use('/weight', weightRoutes);
router.use('/ai', aiRoutes);
router.use('/admin', adminRoutes);

export default router;
