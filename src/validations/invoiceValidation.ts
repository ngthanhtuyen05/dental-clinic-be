import { z } from 'zod';
import { PaymentMethod, InvoiceStatus } from '../constants/enums.js';

export const createInvoiceSchema = z.object({
  body: z.object({
    patientProfileId: z.number({ message: 'patientProfileId là bắt buộc' }).int().positive(),
    appointmentId: z.number().int().positive().nullable().optional(),
    treatmentHistoryId: z.number().int().positive().nullable().optional(),
    prescriptionId: z.number().int().positive().nullable().optional(),
    totalAmount: z.number().min(0).optional(),
    discountAmount: z.number().min(0).optional(),
    paidAmount: z.number().min(0).optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).nullable().optional(),
    transactionRef: z.string().max(100).nullable().optional(),
    status: z.nativeEnum(InvoiceStatus).optional(),
    items: z.array(z.any()).optional(),
    notes: z.string().max(1000).nullable().optional(),
  }),
});

export const payInvoiceSchema = z.object({
  body: z.object({
    paymentMethod: z.nativeEnum(PaymentMethod, {
      message: 'Phương thức thanh toán không hợp lệ (hỗ trợ: cash, bank_transfer, pos_card, momo)',
    }),
    amount: z.number().min(0, 'Số tiền thanh toán phải lớn hơn hoặc bằng 0').optional(),
    transactionRef: z.string().max(100).nullable().optional(),
    notes: z.string().max(1000).nullable().optional(),
  }),
});

export const createMomoPaymentSchema = z.object({
  body: z.object({
    redirectUrl: z.string().url('URL chuyển hướng không hợp lệ').optional(),
  }),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>['body'];
export type PayInvoiceInput = z.infer<typeof payInvoiceSchema>['body'];
