import { z } from 'zod';

export const importStockSchema = z.object({
  body: z.object({
    supplierId: z.number().int().positive().optional(),
    items: z.array(z.object({
      productId: z.number().int().positive({ message: 'ID sản phẩm không hợp lệ' }),
      batchNumber: z.string().min(1, 'Số lô không được để trống').max(50),
      quantity: z.number().int().min(1, 'Số lượng phải >= 1'),
      importPrice: z.number().min(0, 'Đơn giá phải >= 0'),
      manufacturingDate: z.string().nullable().optional(),
      expiryDate: z.string().nullable().optional(),
    })).min(1, 'Cần ít nhất 1 sản phẩm'),
  }),
});
