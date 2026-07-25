import { stockRepository } from '../repositories/stockRepository.js';
import { productRepository } from '../repositories/productRepository.js';
import AppError from '../utils/AppError.js';
import HttpStatus from '../constants/httpStatus.js';
import { StockTransactionType } from '../constants/enums.js';

interface ImportItem {
  productId: number;
  batchNumber: string;
  quantity: number;
  importPrice: number;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
}

interface ImportStockParams {
  supplierId?: number;
  items: ImportItem[];
  performedBy: number;
}

export const importStock = async (params: ImportStockParams) => {
  const { items, performedBy } = params;

  // Validate all products exist
  for (const item of items) {
    const product = await productRepository.findById(item.productId);
    if (!product) {
      throw new AppError(`Sản phẩm với ID ${item.productId} không tồn tại`, HttpStatus.NOT_FOUND);
    }
  }

  const sequelize = await stockRepository.getSequelizeInstance();
  const transaction = await sequelize.transaction();

  try {
    const createdBatches = [];

    for (const item of items) {
      // 1. Create StockBatch
      const batch = await stockRepository.createBatch({
        productId: item.productId,
        batchNumber: item.batchNumber,
        initialQty: item.quantity,
        currentQty: item.quantity,
        importPrice: item.importPrice,
        manufacturingDate: item.manufacturingDate || null,
        expiryDate: item.expiryDate || null,
      }, transaction);

      // 2. Create StockTransaction
      await stockRepository.createTransaction({
        productId: item.productId,
        batchId: batch.id,
        type: StockTransactionType.IMPORT,
        quantity: item.quantity,
        performedBy,
        reason: `Nhập kho lô ${item.batchNumber}`,
      }, transaction);

      createdBatches.push(batch);
    }

    await transaction.commit();

    return {
      totalItems: items.length,
      totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
      totalValue: items.reduce((sum, i) => sum + i.quantity * i.importPrice, 0),
      batches: createdBatches,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

interface GetTransactionsParams {
  page: number;
  limit: number;
  productId?: number;
  type?: StockTransactionType;
}

export const getTransactions = async (params: GetTransactionsParams) => {
  const { page, limit, productId, type } = params;
  const offset = (page - 1) * limit;
  const where: any = {};
  if (productId) where.productId = productId;
  if (type) where.type = type;

  const { rows, count } = await stockRepository.findTransactions({ where, limit, offset });

  return {
    transactions: rows,
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit),
  };
};
