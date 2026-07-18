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
      .optional(),
    role: z.enum(staffRoles as any, { message: 'Vai trò không hợp lệ' }),
    specialty: z.string().max(200).optional(),
    hireDate: z.string({ message: 'Ngày vào làm là bắt buộc' }),
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
      .optional(),
    address: z.string().max(500).optional(),
    notes: z.string().max(1000).optional(),
    staffStatus: z.nativeEnum(StaffStatus).optional().default(StaffStatus.ACTIVE),
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
    hireDate: z.string().optional(),
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
  }),
});
