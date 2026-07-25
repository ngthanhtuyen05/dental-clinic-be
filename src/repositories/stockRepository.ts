import { fn, col } from 'sequelize';
import { StockBatch, StockTransaction, Product, User } from '../models/index.js';
import sequelize from '../config/db.js';

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
}

export const stockRepository = new StockRepository();
