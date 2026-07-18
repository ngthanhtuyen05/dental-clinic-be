import { z } from 'zod';
import { ServiceUnit } from '../constants/enums.js';

export const createServiceSchema = z.object({
  body: z.object({
    categoryId: z.number({ message: 'categoryId là bắt buộc' }).int().positive(),
    name: z.string({ message: 'Tên dịch vụ là bắt buộc' }).min(1).max(200),
    description: z.string().max(1000).optional(),
    price: z.number({ message: 'Giá là bắt buộc' }).min(0),
    unit: z.nativeEnum(ServiceUnit).optional().default(ServiceUnit.SESSION),
    durationMinutes: z.number().int().min(5).optional().default(30),
  }),
});

export const updateServiceSchema = z.object({
  body: z.object({
    categoryId: z.number().int().positive().optional(),
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).nullable().optional(),
    price: z.number().min(0).optional(),
    unit: z.nativeEnum(ServiceUnit).optional(),
    durationMinutes: z.number().int().min(5).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string({ message: 'Tên nhóm là bắt buộc' }).min(1).max(100),
    description: z.string().max(500).optional(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).nullable().optional(),
    sortOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  }),
});
