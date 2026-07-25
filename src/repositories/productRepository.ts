import { Op, type WhereOptions } from 'sequelize';
import { Product, Supplier } from '../models/index.js';
import type { InventoryCategory } from '../constants/enums.js';

const CATEGORY_CODE_PREFIX: Record<string, string> = {
  medicine: 'MED',
  dental_supply: 'DNS',
  needle: 'NDL',
  glove: 'GLV',
  mask: 'MSK',
};

export class ProductRepository {
  async findAndCount(options: {
    where?: WhereOptions;
    limit: number;
    offset: number;
  }) {
    return Product.findAndCountAll({
      where: options.where,
      order: [['id', 'DESC']],
      limit: options.limit,
      offset: options.offset,
      distinct: true,
      include: [{ model: Supplier, as: 'supplier', attributes: ['id', 'name'] }],
    });
  }

  async findById(id: number) {
    return Product.findByPk(id, {
      include: [{ model: Supplier, as: 'supplier', attributes: ['id', 'name'] }],
    });
  }

  async findByNameInCategory(name: string, category: InventoryCategory) {
    return Product.findOne({ where: { name, category } });
  }

  async create(data: any) {
    return Product.create(data);
  }

  async update(id: number, data: any) {
    const product = await Product.findByPk(id);
    if (!product) return null;
    return product.update(data);
  }

  async delete(id: number) {
    const product = await Product.findByPk(id);
    if (!product) return false;
    await product.destroy();
    return true;
  }

  /**
   * Auto-generate product code like MED-001, DNS-002
   */
  async generateCode(category: InventoryCategory): Promise<string> {
    const prefix = CATEGORY_CODE_PREFIX[category] || 'PRD';
    const lastProduct = await Product.findOne({
      where: { code: { [Op.like]: `${prefix}-%` } },
      order: [['code', 'DESC']],
    });

    let nextNum = 1;
    if (lastProduct) {
      const match = lastProduct.code.match(/-(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }

    return `${prefix}-${String(nextNum).padStart(3, '0')}`;
  }

  buildSearchWhere(options: {
    keyword?: string;
    category?: InventoryCategory;
    status?: string;
  }): WhereOptions | undefined {
    const conditions: any[] = [];

    if (options.keyword?.trim()) {
      const kw = `%${options.keyword.trim()}%`;
      conditions.push({
        [Op.or]: [
          { name: { [Op.like]: kw } },
          { code: { [Op.like]: kw } },
        ],
      });
    }

    if (options.category) {
      conditions.push({ category: options.category });
    }

    if (options.status === 'active') {
      conditions.push({ isActive: true });
    } else if (options.status === 'discontinued') {
      conditions.push({ isActive: false });
    }

    if (conditions.length === 0) return undefined;
    if (conditions.length === 1) return conditions[0] as WhereOptions;
    return { [Op.and]: conditions } as any;
  }
}

export const productRepository = new ProductRepository();
