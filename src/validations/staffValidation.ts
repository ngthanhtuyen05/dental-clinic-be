import { z } from 'zod';
import { UserRole, StaffStatus } from '../constants/enums.js';

const staffRoles = [UserRole.ADMIN, UserRole.DENTIST, UserRole.STAFF] as const;

// Regex SĐT Việt Nam: bắt đầu 03, 05, 07, 08, 09 + 8 số
const vnPhoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;

export const createStaffSchema = z.object({
  body: z.object({
    fullName: z.string({ message: 'Họ tên là bắt buộc' }).min(1).max(100),
    email: z.string({ message: 'Email là bắt buộc' }).email('Email không hợp lệ'),
    phone: z.string()
      .regex(vnPhoneRegex, 'SĐT Việt Nam không hợp lệ (VD: 0912345678)')
      .optional()
      .nullable(),
    role: z.enum(staffRoles as any, { message: 'Vai trò không hợp lệ' }),
    specialty: z.string().max(200).optional().nullable(),
    specialtyId: z.number().int().optional().nullable(),
    hireDate: z.string({ message: 'Ngày vào làm là bắt buộc' }),
    gender: z.string().max(20).optional().nullable(),
    dateOfBirth: z.string()
      .refine((val) => {
        if (!val) return true;
        const dob = new Date(val);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
        return age >= 18;
      }, { message: 'Nhân viên phải đủ 18 tuổi' })
      .optional()
      .nullable(),
    address: z.string().max(500).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
    staffStatus: z.nativeEnum(StaffStatus).optional().default(StaffStatus.ACTIVE),
    // Bác sĩ / Doctor fields
    academicTitle: z.string().max(50).optional().nullable(),
    licenseNumber: z.string().max(50).optional().nullable(),
    licenseDate: z.string().optional().nullable(),
    experienceYears: z.number().int().min(0).optional().nullable(),
    avatar: z.string().optional().nullable(),
    badge: z.string().max(100).optional().nullable(),
    bio: z.string().optional().nullable(),
    quote: z.string().max(255).optional().nullable(),
    education: z.array(z.any()).optional().nullable(),
    certificates: z.array(z.any()).optional().nullable(),
    achievements: z.array(z.any()).optional().nullable(),
    workingSchedule: z.string().max(255).optional().nullable(),
    slotDuration: z.number().int().min(10).max(240).optional().nullable(),
    subSpecialties: z.array(z.string()).optional().nullable(),
  }),
});

export const updateStaffSchema = z.object({
  body: z.object({
    fullName: z.string().min(1).max(100).optional(),
    email: z.string().email('Email không hợp lệ').optional(),
    phone: z.string()
      .regex(vnPhoneRegex, 'SĐT Việt Nam không hợp lệ (VD: 0912345678)')
      .nullable()
      .optional(),
    role: z.enum(staffRoles as any).optional(),
    specialty: z.string().max(200).nullable().optional(),
    specialtyId: z.number().int().nullable().optional(),
    hireDate: z.string().optional(),
    gender: z.string().max(20).nullable().optional(),
    dateOfBirth: z.string()
      .refine((val) => {
        if (!val) return true;
        const dob = new Date(val);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
        return age >= 18;
      }, { message: 'Nhân viên phải đủ 18 tuổi' })
      .nullable()
      .optional(),
    address: z.string().max(500).nullable().optional(),
    notes: z.string().max(1000).nullable().optional(),
    staffStatus: z.nativeEnum(StaffStatus).optional(),
    // Bác sĩ / Doctor fields
    academicTitle: z.string().max(50).nullable().optional(),
    licenseNumber: z.string().max(50).nullable().optional(),
    licenseDate: z.string().nullable().optional(),
    experienceYears: z.number().int().min(0).nullable().optional(),
    avatar: z.string().nullable().optional(),
    badge: z.string().max(100).nullable().optional(),
    bio: z.string().nullable().optional(),
    quote: z.string().max(255).nullable().optional(),
    education: z.array(z.any()).nullable().optional(),
    certificates: z.array(z.any()).nullable().optional(),
    achievements: z.array(z.any()).nullable().optional(),
    workingSchedule: z.string().max(255).nullable().optional(),
    slotDuration: z.number().int().min(10).max(240).nullable().optional(),
    subSpecialties: z.array(z.string()).nullable().optional(),
  }),
});
