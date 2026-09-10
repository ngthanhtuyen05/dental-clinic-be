import { fn, col, Op } from 'sequelize';
import { StockBatch, StockTransaction, Product, User } from '../models/index.js';
import sequelize from '../config/db.js';
import { StockTransactionType } from '../constants/enums.js';
import AppError from '../utils/AppError.js';
import HttpStatus from '../constants/httpStatus.js';

export class StockRepository {
  async createBatch(data: {
    productId: number;
    batchNumber: string;
    initialQty: number;
    currentQty: number;
    importPrice: number;
    manufacturingDate?: string | null;
    expiryDate?: string | null;
  }, transaction?: any) {
    return StockBatch.create(data as any, { transaction });
  }

  async createTransaction(data: {
    productId: number;
    batchId?: number | null;
    type: string;
    quantity: number;
    performedBy: number;
    reason?: string | null;
  }, transaction?: any) {
    return StockTransaction.create(data as any, { transaction });
  }

  async findBatchById(batchId: number) {
    return StockBatch.findByPk(batchId);
  }

  async findBatchesByProduct(productId: number, onlyAvailable = true) {
    const where: any = { productId };
    if (onlyAvailable) {
      where.currentQty = { [Op.gt]: 0 };
    }
    return StockBatch.findAll({
      where,
      order: [
        ['expiryDate', 'ASC'],
        ['id', 'ASC'],
      ],
    });
  }

  /**
   * Get total current stock for a product (SUM of currentQty across all batches)
   */
  async getProductTotalStock(productId: number): Promise<number> {
    const result = await StockBatch.findOne({
      where: { productId },
      attributes: [[fn('SUM', col('currentQty')), 'total']],
      raw: true,
    }) as any;
    return result?.total ? parseInt(result.total, 10) : 0;
  }

  async getSequelizeInstance() {
    return sequelize;
  }

  async findTransactions(options: {
    where?: any;
    limit: number;
    offset: number;
  }) {
    return StockTransaction.findAndCountAll({
      where: options.where,
      order: [['id', 'DESC']],
      limit: options.limit,
      offset: options.offset,
      distinct: true,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'code', 'name', 'unit'] },
        { model: StockBatch, as: 'batch', attributes: ['id', 'batchNumber'] },
        { model: User, as: 'performer', attributes: ['id', 'fullName'] },
      ],
    });
  }

  async countByType(): Promise<Record<string, number>> {
    const results = await StockTransaction.findAll({
      attributes: [
        'type',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['type'],
      raw: true,
    }) as any[];

    const counts: Record<string, number> = {};
    for (const row of results) {
      counts[row.type] = parseInt(row.count, 10);
    }
    return counts;
  }

  /**
   * Tìm tất cả các lô hàng cận date hoặc đã quá hạn còn tồn kho
   */
  async findExpiringBatches(days = 60) {
    const today = new Date().toISOString().split('T')[0];
    const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const batches = await StockBatch.findAll({
      where: {
        currentQty: { [Op.gt]: 0 },
        expiryDate: {
          [Op.ne]: null,
          [Op.lte]: targetDate,
        },
      },
      order: [['expiryDate', 'ASC']],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'code', 'name', 'unit', 'importUnit', 'conversionRate', 'category', 'minStock'],
        },
      ],
    });

    return batches;
  }

  /**
   * Thống kê tổng quan KPI kho (tổng vốn, cảnh báo hết hàng, cận date)
   */
  async getInventoryStatsSummary() {
    const today = new Date().toISOString().split('T')[0];
    const next60Days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [totalProducts, valueResult, expiredCount, expiringSoonCount] = await Promise.all([
      Product.count({ where: { isActive: true } }),
      StockBatch.findOne({
        attributes: [[fn('SUM', fn('COALESCE', col('currentQty') as any, 0)), 'totalQty']],
        raw: true,
      }),
      StockBatch.count({
        where: {
          currentQty: { [Op.gt]: 0 },
          expiryDate: { [Op.ne]: null, [Op.lt]: today },
        },
      }),
      StockBatch.count({
        where: {
          currentQty: { [Op.gt]: 0 },
          expiryDate: { [Op.ne]: null, [Op.between]: [today, next60Days] },
        },
      }),
    ]);

    // Query value by sum(currentQty * importPrice)
    const batches = await StockBatch.findAll({
      where: { currentQty: { [Op.gt]: 0 } },
      attributes: ['currentQty', 'importPrice'],
      raw: true,
    }) as any[];
    const totalStockValue = batches.reduce((sum, b) => sum + (Number(b.currentQty) || 0) * (Number(b.importPrice) || 0), 0);

    return {
      totalProducts,
      totalStockValue,
      expiredCount,
      expiringSoonCount,
    };
  }
}

export const stockRepository = new StockRepository();

