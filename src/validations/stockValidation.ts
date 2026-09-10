import { z } from 'zod';
import { StockTransactionType } from '../constants/enums.js';

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

export const consumeStockSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      productId: z.number().int().positive({ message: 'ID sản phẩm không hợp lệ' }),
      quantity: z.number().int().min(1, 'Số lượng xuất phải >= 1'),
      batchId: z.number().int().positive().nullable().optional(),
      type: z.nativeEnum(StockTransactionType).optional(),
      reason: z.string().max(500).optional(),
    })).min(1, 'Cần ít nhất 1 sản phẩm để xuất kho'),
    reason: z.string().max(500).optional(),
  }),
});

export const adjustStockSchema = z.object({
  body: z.object({
    productId: z.number().int().positive({ message: 'ID sản phẩm không hợp lệ' }),
    actualQuantity: z.number().int().min(0, 'Số lượng thực tế kiểm đếm phải >= 0'),
    reason: z.string().min(2, 'Vui lòng cung cấp lý do / giải trình chênh lệch kiểm kê').max(500),
  }),
});

