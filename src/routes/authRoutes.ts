import express from 'express';
import { login, register, logout, refreshToken } from '../controllers/authController.js';
import { validate } from '../middlewares/validate.js';
import { loginUserSchema, registerUserSchema, refreshTokenSchema } from '../validations/userValidation.js';

const router = express.Router();

// Auth routes — Public (không cần đăng nhập)
router.post('/login', validate(loginUserSchema), login);
router.post('/register', validate(registerUserSchema), register);
router.post('/logout', validate(refreshTokenSchema), logout);
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);

export default router;
