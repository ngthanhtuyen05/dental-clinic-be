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

  const [{ rows, count }, typeCounts] = await Promise.all([
    stockRepository.findTransactions({ where, limit, offset }),
    stockRepository.countByType(),
  ]);

  return {
    transactions: rows,
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit),
    typeCounts,
  };
};

export const getProductBatches = async (productId: number) => {
  const product = await productRepository.findById(productId);
  if (!product) {
    throw new AppError(`Sản phẩm với ID ${productId} không tồn tại`, HttpStatus.NOT_FOUND);
  }
  const batches = await stockRepository.findBatchesByProduct(productId, true);
  return batches;
};

interface ConsumeItem {
  productId: number;
  quantity: number;
  batchId?: number | null;
  type?: StockTransactionType;
  reason?: string | null;
}

interface ConsumeStockParams {
  items: ConsumeItem[];
  performedBy: number;
  reason?: string;
}

export const consumeStock = async (params: ConsumeStockParams) => {
  const { items, performedBy, reason: globalReason } = params;

  // Validate all products
  for (const item of items) {
    const product = await productRepository.findById(item.productId);
    if (!product) {
      throw new AppError(`Sản phẩm với ID ${item.productId} không tồn tại`, HttpStatus.NOT_FOUND);
    }
  }

  const sequelize = await stockRepository.getSequelizeInstance();
  const transaction = await sequelize.transaction();

  try {
    const createdTransactions = [];

    for (const item of items) {
      const itemType = item.type || StockTransactionType.TREATMENT;
      const itemReason = item.reason || globalReason || 'Xuất kho sử dụng điều trị / phòng khám';

      if (item.batchId) {
        // Chỉ định lô cụ thể
        const batch = await stockRepository.findBatchById(item.batchId, transaction);
        if (!batch || batch.productId !== item.productId) {
          throw new AppError(`Lô hàng #${item.batchId} không hợp lệ cho sản phẩm này`, HttpStatus.BAD_REQUEST);
        }
        if (batch.currentQty < item.quantity) {
          throw new AppError(
            `Lô hàng ${batch.batchNumber} chỉ còn ${batch.currentQty} (yêu cầu xuất ${item.quantity})`,
            HttpStatus.BAD_REQUEST
          );
        }

        await batch.decrement('currentQty', { by: item.quantity, transaction });

        const tx = await stockRepository.createTransaction({
          productId: item.productId,
          batchId: batch.id,
          type: itemType,
          quantity: item.quantity,
          performedBy,
          reason: itemReason,
        }, transaction);

        createdTransactions.push(tx);
      } else {
        // Tự động phân bổ FEFO / FIFO (lô hết hạn trước, nhập trước trừ trước)
        const batches = await stockRepository.findBatchesByProduct(item.productId, true, transaction);
        const totalStock = batches.reduce((sum, b) => sum + b.currentQty, 0);

        if (totalStock < item.quantity) {
          const prod = await productRepository.findById(item.productId);
          throw new AppError(
            `Sản phẩm "${prod?.name || item.productId}" không đủ tồn kho để xuất. Tồn hiện tại: ${totalStock}, yêu cầu: ${item.quantity}`,
            HttpStatus.BAD_REQUEST
          );
        }

        let remaining = item.quantity;
        for (const batch of batches) {
          if (remaining <= 0) break;
          const take = Math.min(batch.currentQty, remaining);
          await batch.decrement('currentQty', { by: take, transaction });

          const tx = await stockRepository.createTransaction({
            productId: item.productId,
            batchId: batch.id,
            type: itemType,
            quantity: take,
            performedBy,
            reason: `${itemReason} (Lô ${batch.batchNumber})`,
          }, transaction);

          createdTransactions.push(tx);
          remaining -= take;
        }
      }
    }

    await transaction.commit();

    return {
      totalItems: items.length,
      totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
      transactions: createdTransactions,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

interface AdjustStockParams {
  productId: number;
  actualQuantity: number;
  performedBy: number;
  reason: string;
}

export const adjustStock = async (params: AdjustStockParams) => {
  const { productId, actualQuantity, performedBy, reason } = params;

  const product = await productRepository.findById(productId);
  if (!product) {
    throw new AppError(`Sản phẩm với ID ${productId} không tồn tại`, HttpStatus.NOT_FOUND);
  }

  const currentTotal = await stockRepository.getProductTotalStock(productId);
  const diff = actualQuantity - currentTotal;

  if (diff === 0) {
    return {
      productId,
      currentStock: currentTotal,
      actualQuantity,
      diff: 0,
      message: 'Số lượng thực tế khớp chính xác với hệ thống, không có biến động tồn kho.',
    };
  }

  const sequelize = await stockRepository.getSequelizeInstance();
  const transaction = await sequelize.transaction();

  try {
    if (diff < 0) {
      // Thâm hụt (giảm kho)
      const deductQty = Math.abs(diff);
      const batches = await stockRepository.findBatchesByProduct(productId, true, transaction);

      let remaining = deductQty;
      for (const batch of batches) {
        if (remaining <= 0) break;
        const take = Math.min(batch.currentQty, remaining);
        await batch.decrement('currentQty', { by: take, transaction });

        await stockRepository.createTransaction({
          productId,
          batchId: batch.id,
          type: StockTransactionType.ADJUSTMENT,
          quantity: take,
          performedBy,
          reason: `Kiểm kê điều chỉnh giảm ${deductQty} (Lô ${batch.batchNumber} trừ ${take}) - Lý do: ${reason}`,
        }, transaction);

        remaining -= take;
      }
    } else {
      // Dư thừa (tăng kho)
      const addQty = diff;
      const batches = await stockRepository.findBatchesByProduct(productId, false, transaction);
      let targetBatch = batches.length > 0 ? batches[batches.length - 1] : null;

      if (targetBatch) {
        await targetBatch.increment('currentQty', { by: addQty, transaction });
      } else {
        targetBatch = await stockRepository.createBatch({
          productId,
          batchNumber: `LOT-ADJ-${Date.now().toString().slice(-6)}`,
          initialQty: addQty,
          currentQty: addQty,
          importPrice: 0,
        }, transaction);
      }

      await stockRepository.createTransaction({
        productId,
        batchId: targetBatch.id,
        type: StockTransactionType.ADJUSTMENT,
        quantity: addQty,
        performedBy,
        reason: `Kiểm kê điều chỉnh tăng +${addQty} (Lô ${targetBatch.batchNumber}) - Lý do: ${reason}`,
      }, transaction);
    }

    await transaction.commit();

    return {
      productId,
      productName: product.name,
      previousStock: currentTotal,
      newStock: actualQuantity,
      diff,
      reason,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const getExpiryAlerts = async (days = 60) => {
  const batches = await stockRepository.findExpiringBatches(days);
  const now = Date.now();

  const formatted = batches.map((b: any) => {
    const expTime = new Date(b.expiryDate).getTime();
    const daysRemaining = Math.ceil((expTime - now) / (24 * 60 * 60 * 1000));
    const isExpired = daysRemaining < 0;

    return {
      id: b.id,
      batchNumber: b.batchNumber,
      productId: b.productId,
      currentQty: b.currentQty,
      initialQty: b.initialQty,
      importPrice: Number(b.importPrice),
      manufacturingDate: b.manufacturingDate,
      expiryDate: b.expiryDate,
      daysRemaining,
      isExpired,
      product: {
        id: b.product?.id,
        code: b.product?.code,
        name: b.product?.name,
        unit: b.product?.unit,
        importUnit: b.product?.importUnit,
        conversionRate: b.product?.conversionRate || 1,
        category: b.product?.category,
      },
    };
  });

  const expiredCount = formatted.filter((b) => b.isExpired).length;
  const expiringSoonCount = formatted.filter((b) => !b.isExpired && b.daysRemaining <= days).length;

  return {
    days,
    totalAlerts: formatted.length,
    expiredCount,
    expiringSoonCount,
    batches: formatted,
  };
};

export const getInventoryStats = async () => {
  const summary = await stockRepository.getInventoryStatsSummary();
  const allProducts = await productRepository.findAndCount({ limit: 1000, offset: 0 });

  const lowStockCount = allProducts.rows.filter((p: any) => {
    const total = Number(p.dataValues?.totalStock ?? p.totalStock ?? 0);
    return total > 0 && total <= p.minStock;
  }).length;

  const outOfStockCount = allProducts.rows.filter((p: any) => {
    const total = Number(p.dataValues?.totalStock ?? p.totalStock ?? 0);
    return total === 0;
  }).length;

  return {
    totalProducts: summary.totalProducts,
    totalStockValue: summary.totalStockValue,
    lowStockCount,
    outOfStockCount,
    expiringSoonCount: summary.expiringSoonCount,
    expiredCount: summary.expiredCount,
  };
};

