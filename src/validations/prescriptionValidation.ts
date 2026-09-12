import { z } from 'zod';
import { PrescriptionStatus, DosageFrequency, MealRelation } from '../constants/enums.js';

const prescriptionItemSchema = z.object({
  productId: z.number({ message: 'productId là bắt buộc' }).int().positive(),
  dosageTemplateId: z.number().int().positive().nullable().optional(),
  dosageText: z.string({ message: 'Cách dùng là bắt buộc' }).min(1, 'Cách dùng là bắt buộc').max(500),
  quantityPerDose: z
    .number({ message: 'Số lượng mỗi lần dùng là bắt buộc' })
    .positive('Số lượng mỗi lần dùng phải lớn hơn 0'),
  frequency: z.nativeEnum(DosageFrequency, { message: 'Tần suất dùng không hợp lệ' }),
  durationDays: z
    .number({ message: 'Số ngày dùng là bắt buộc' })
    .int()
    .positive('Số ngày dùng phải lớn hơn 0'),
  mealRelation: z.nativeEnum(MealRelation, { message: 'Thời điểm dùng thuốc không hợp lệ' }),
  usageInstruction: z.string().max(500).nullable().optional(),
  warnings: z.string().max(500).nullable().optional(),
});

export const createPrescriptionSchema = z.object({
  body: z.object({
    patientProfileId: z
      .union([z.number(), z.string()])
      .refine((v) => v !== undefined && v !== null && String(v).trim() !== '', {
        message: 'patientProfileId là bắt buộc',
      }),
    appointmentId: z.number().int().positive().nullable().optional(),
    treatmentHistoryId: z.number().int().positive().nullable().optional(),
    diagnosis: z.string({ message: 'Chẩn đoán là bắt buộc' }).min(1, 'Chẩn đoán là bắt buộc').max(500),
    notes: z.string().max(1000).nullable().optional(),
    status: z.nativeEnum(PrescriptionStatus).optional(),
    items: z.array(prescriptionItemSchema).min(1, 'Đơn thuốc phải có ít nhất 1 loại thuốc'),
  }),
});

export const updatePrescriptionStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(PrescriptionStatus, { message: 'Trạng thái không hợp lệ' }),
  }),
});

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>['body'];
