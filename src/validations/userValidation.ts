import { z } from 'zod';
import { UserRole } from '../constants/enums.js';

export const createUserSchema = z.object({
  body: z.object({
    fullName: z.string({ message: 'Full name is required' }).min(3, 'Full name must be at least 3 characters long'),
    email: z.string({ message: 'Email is required' }).email('Invalid email address'),
    password: z.string({ message: 'Password is required' }).min(6, 'Password must be at least 6 characters long'),
    phone: z.string().optional(),
    role: z.nativeEnum(UserRole).optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    fullName: z.string().min(3, 'Full name must be at least 3 characters long').optional(),
    email: z.string().email('Invalid email address').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters long').optional(),
    phone: z.string().optional(),
    role: z.nativeEnum(UserRole).optional(),
  }),
});

export const loginUserSchema = z.object({
  body: z.object({
    email: z.string({ message: 'Email is required' }).email('Invalid email address'),
    password: z.string({ message: 'Password is required' }).min(6, 'Password must be at least 6 characters long'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string({ message: 'Refresh Token is required' }),
  }),
});

export const registerUserSchema = z.object({
  body: z.object({
    fullName: z.string({ message: 'Họ và tên là bắt buộc' }).min(3, 'Họ và tên phải dài ít nhất 3 ký tự'),
    phone: z.string({ message: 'Số điện thoại là bắt buộc' }).regex(/^\d{10,11}$/, 'Số điện thoại không hợp lệ (10-11 chữ số)'),
    email: z.string({ message: 'Email là bắt buộc' }).email('Địa chỉ email không hợp lệ'),
    password: z.string({ message: 'Mật khẩu là bắt buộc' }).min(6, 'Mật khẩu phải dài ít nhất 6 ký tự'),
    confirmPassword: z.string({ message: 'Xác nhận mật khẩu là bắt buộc' }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  }),
});

