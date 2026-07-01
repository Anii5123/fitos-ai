import { Router } from 'express';
import { getSystemStats, listUsers, changeUserRole, deleteUser } from '../controllers/adminController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = Router();

router.get('/stats', protect, authorize('admin'), getSystemStats);
router.get('/users', protect, authorize('admin'), listUsers);
router.put('/users/:id/role', protect, authorize('admin'), changeUserRole);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

export default router;
