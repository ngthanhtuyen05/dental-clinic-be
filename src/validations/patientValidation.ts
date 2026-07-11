import { z } from 'zod';

export const createPatientSchema = z.object({
  body: z.object({
    fullName: z.string({ message: 'Họ và tên là bắt buộc' })
      .min(3, 'Họ và tên phải dài ít nhất 3 ký tự'),
    email: z.string({ message: 'Email là bắt buộc' })
      .email('Địa chỉ email không hợp lệ'),
    phone: z.string({ message: 'Số điện thoại là bắt buộc' })
      .regex(/^\d{10,11}$/, 'Số điện thoại không hợp lệ (10-11 chữ số)'),
    gender: z.enum(['male', 'female', 'other']).optional(),
    dateOfBirth: z.string().optional(),
    allergies: z.string().optional(),
    chronicDiseases: z.string().optional(),
    bloodType: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    currentMedications: z.string().optional(),
    isSmoking: z.boolean().optional(),
    hasBruxism: z.boolean().optional(),
    isPregnant: z.boolean().optional(),
    dentalHistory: z.string().optional(),
    chiefComplaint: z.string().optional(),
  }),
});

export const updatePatientSchema = z.object({
  body: z.object({
    fullName: z.string().min(3, 'Họ và tên phải dài ít nhất 3 ký tự').optional(),
    email: z.string().email('Địa chỉ email không hợp lệ').optional(),
    phone: z.string().regex(/^\d{10,11}$/, 'Số điện thoại không hợp lệ').optional(),
    password: z.string().min(6, 'Mật khẩu phải dài ít nhất 6 ký tự').optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    dateOfBirth: z.string().optional(),
    allergies: z.string().optional(),
    chronicDiseases: z.string().optional(),
    bloodType: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    currentMedications: z.string().optional(),
    isSmoking: z.boolean().optional(),
    hasBruxism: z.boolean().optional(),
    isPregnant: z.boolean().optional(),
    dentalHistory: z.string().optional(),
    chiefComplaint: z.string().optional(),
  }),
});
