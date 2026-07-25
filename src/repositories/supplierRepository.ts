import { Op, type WhereOptions } from 'sequelize';
import { Supplier } from '../models/index.js';

export class SupplierRepository {
  async findAndCount(options: {
    where?: WhereOptions;
    limit: number;
    offset: number;
  }) {
    return Supplier.findAndCountAll({
      where: options.where,
      order: [['id', 'DESC']],
      limit: options.limit,
      offset: options.offset,
      distinct: true,
    });
  }

  async findAll() {
    return Supplier.findAll({
      order: [['name', 'ASC']],
    });
  }

  async findById(id: number) {
    return Supplier.findByPk(id);
  }

  async findByName(name: string) {
    return Supplier.findOne({ where: { name } });
  }

  async create(data: any) {
    return Supplier.create(data);
  }

  async update(id: number, data: any) {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) return null;
    return supplier.update(data);
  }

  async delete(id: number) {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) return false;
    await supplier.destroy();
    return true;
  }

  buildSearchWhere(keyword?: string): WhereOptions | undefined {
    if (!keyword?.trim()) return undefined;

    const kw = `%${keyword.trim()}%`;
    return {
      [Op.or]: [
        { name: { [Op.like]: kw } },
        { phone: { [Op.like]: kw } },
        { email: { [Op.like]: kw } },
        { contactPerson: { [Op.like]: kw } },
      ],
    } as any;
  }
}

export const supplierRepository = new SupplierRepository();
