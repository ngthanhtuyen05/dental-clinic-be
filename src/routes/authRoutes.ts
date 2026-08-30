import express from 'express';
import { login, register, logout, refreshToken, getMe } from '../controllers/authController.js';
import { validate } from '../middlewares/validate.js';
import { protect } from '../middlewares/authMiddleware.js';
import { loginUserSchema, registerUserSchema, refreshTokenSchema } from '../validations/userValidation.js';

const router = express.Router();

// Auth routes — Public (không cần đăng nhập)
router.post('/login', validate(loginUserSchema), login);
router.post('/register', validate(registerUserSchema), register);
router.post('/logout', validate(refreshTokenSchema), logout);
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);

// Lấy thông tin user đăng nhập hiện tại kèm permissions cập nhật mới nhất
router.get('/me', protect, getMe);

export default router;
