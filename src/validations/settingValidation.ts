import { z } from 'zod';

export const updateClinicSettingSchema = z.object({
  body: z.object({
    name: z.string({ message: 'Tên phòng khám là bắt buộc' }).min(2, 'Tên phòng khám tối thiểu 2 ký tự'),
    slogan: z.string().optional().nullable(),
    taxCode: z.string().optional().nullable(),
    phone: z.string({ message: 'Hotline là bắt buộc' }).min(5, 'Hotline không hợp lệ'),
    email: z.string().email('Email không hợp lệ').optional().nullable(),
    website: z.string().optional().nullable(),
    address: z.string({ message: 'Địa chỉ trụ sở là bắt buộc' }).min(3, 'Địa chỉ tối thiểu 3 ký tự'),
    branch2: z.string().optional().nullable(),
    openTime: z.string().optional().default('08:00'),
    closeTime: z.string().optional().default('20:00'),
    breakStart: z.string().optional().default('12:00'),
    breakEnd: z.string().optional().default('13:30'),
    autoConfirm: z.boolean().optional().default(true),
    allowOnlineBooking: z.boolean().optional().default(true),
  }),
});

export const updatePaymentSettingSchema = z.object({
  body: z.object({
    bankCode: z.string({ message: 'Ngân hàng thụ hưởng là bắt buộc' }),
    accountNo: z.string({ message: 'Số tài khoản là bắt buộc' }).min(4, 'Số tài khoản không hợp lệ'),
    accountName: z.string({ message: 'Tên chủ tài khoản là bắt buộc' }).min(2, 'Tên chủ tài khoản không hợp lệ'),
    qrSyntax: z.string().optional().nullable(),
    enableVietQR: z.boolean().optional().default(true),
    enablePos: z.boolean().optional().default(true),
    enableMomo: z.boolean().optional().default(true),
  }),
});

export const updatePrintSettingSchema = z.object({
  body: z.object({
    paperSize: z.enum(['k80', 'a5', 'a4']).default('k80'),
    receiptTitle: z.string({ message: 'Tiêu đề phiếu thu là bắt buộc' }),
    footerNotes: z.string().optional().nullable(),
    showToothNumber: z.boolean().optional().default(true),
    showDoctorSign: z.boolean().optional().default(true),
    autoPrintAfterPayment: z.boolean().optional().default(false),
  }),
});

export const updateSettingByKeySchema = z.object({
  params: z.object({
    key: z.string().min(1, 'Key cấu hình không được để trống'),
  }),
  body: z.record(z.string(), z.any()),
});
