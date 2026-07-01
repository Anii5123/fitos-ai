import { Router } from 'express';
import {
  register,
  login,
  googleLogin,
  verifyEmail,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  me,
} from '../controllers/authController.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { protect } from '../middlewares/authMiddleware.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/authValidator.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/google-login', googleLogin);
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.get('/me', protect, me);

export default router;
