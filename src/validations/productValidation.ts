import { z } from 'zod';
import { InventoryCategory, ProductUnit } from '../constants/enums.js';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Tên sản phẩm không được để trống').max(200),
    category: z.nativeEnum(InventoryCategory, { message: 'Danh mục không hợp lệ' }),
    unit: z.nativeEnum(ProductUnit, { message: 'Đơn vị tính không hợp lệ' }),
    supplierId: z.number().int().positive().nullable().optional(),
    minStock: z.number().int().min(0, 'Mức tối thiểu phải >= 0'),
    sellingPrice: z.number().min(0, 'Giá bán niêm yết phải >= 0').optional(),
    importUnit: z.string().max(20).nullable().optional(),
    conversionRate: z.number().int().min(1, 'Tỉ lệ quy đổi phải >= 1').optional(),
    description: z.string().max(1000).nullable().optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    category: z.nativeEnum(InventoryCategory).optional(),
    unit: z.nativeEnum(ProductUnit).optional(),
    supplierId: z.number().int().positive().nullable().optional(),
    minStock: z.number().int().min(0).optional(),
    sellingPrice: z.number().min(0, 'Giá bán niêm yết phải >= 0').optional(),
    importUnit: z.string().max(20).nullable().optional(),
    conversionRate: z.number().int().min(1, 'Tỉ lệ quy đổi phải >= 1').optional(),
    description: z.string().max(1000).nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

