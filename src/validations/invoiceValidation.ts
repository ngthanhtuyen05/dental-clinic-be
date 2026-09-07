import { z } from 'zod';
import { PaymentMethod } from '../constants/enums.js';

export const createInvoiceSchema = z.object({
  body: z.object({
    patientProfileId: z.number({ message: 'patientProfileId là bắt buộc' }).int().positive(),
    appointmentId: z.number().int().positive().nullable().optional(),
    treatmentHistoryId: z.number().int().positive().nullable().optional(),
    prescriptionId: z.number().int().positive().nullable().optional(),
    totalAmount: z.number().min(0).optional(),
    discountAmount: z.number().min(0).optional(),
    notes: z.string().max(1000).nullable().optional(),
  }),
});

export const payInvoiceSchema = z.object({
  body: z.object({
    paymentMethod: z.nativeEnum(PaymentMethod, {
      message: 'Phương thức thanh toán không hợp lệ (hỗ trợ: cash, bank_transfer)',
    }),
  }),
});

export const createMomoPaymentSchema = z.object({
  body: z.object({
    redirectUrl: z.string().url('URL chuyển hướng không hợp lệ').optional(),
  }),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>['body'];
export type PayInvoiceInput = z.infer<typeof payInvoiceSchema>['body'];
