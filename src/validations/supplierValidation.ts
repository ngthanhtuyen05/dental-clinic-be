import { z } from 'zod';

export const createSupplierSchema = z.object({
  body: z.object({
    name: z.string({ message: 'Tên nhà cung cấp là bắt buộc' }).min(1).max(200),
    contactPerson: z.string().max(100).optional(),
    phone: z.string({ message: 'Số điện thoại là bắt buộc' }).min(1).max(20),
    email: z.string().email('Email không hợp lệ').max(100).optional().or(z.literal('')),
    address: z.string().max(500).optional(),
  }),
});

export const updateSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    contactPerson: z.string().max(100).nullable().optional(),
    phone: z.string().min(1).max(20).optional(),
    email: z.string().email('Email không hợp lệ').max(100).nullable().optional().or(z.literal('')),
    address: z.string().max(500).nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});
