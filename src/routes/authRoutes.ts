import express from 'express';
import {
  login,
  register,
  logout,
  refreshToken,
  getMe,
  updateProfile,
  changePassword,
} from '../controllers/authController.js';
import { validate } from '../middlewares/validate.js';
import { protect } from '../middlewares/authMiddleware.js';
import {
  loginUserSchema,
  registerUserSchema,
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../validations/userValidation.js';

const router = express.Router();

// Auth routes — Public (không cần đăng nhập)
router.post('/login', validate(loginUserSchema), login);
router.post('/register', validate(registerUserSchema), register);
router.post('/logout', validate(refreshTokenSchema), logout);
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);

// Protected routes (yêu cầu đăng nhập)
router.get('/me', protect, getMe);
router.patch('/profile', protect, validate(updateProfileSchema), updateProfile);
router.put('/profile', protect, validate(updateProfileSchema), updateProfile);
router.post('/change-password', protect, validate(changePasswordSchema), changePassword);

export default router;
