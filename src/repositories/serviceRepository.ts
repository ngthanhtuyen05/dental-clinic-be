import { Op, type WhereOptions } from 'sequelize';
import { ServiceCategory, Service } from '../models/index.js';
import AppError from '../utils/AppError.js';
import HttpStatus from '../constants/httpStatus.js';

export class ServiceRepository {
  // ── Categories ──
  async findAllCategories() {
    return ServiceCategory.findAll({
      order: [['sortOrder', 'ASC']],
    });
  }

  async findCategoryById(id: number) {
    return ServiceCategory.findByPk(id);
  }

  async createCategory(data: any) {
    return ServiceCategory.create(data);
  }

  async updateCategory(id: number, data: any) {
    const cat = await ServiceCategory.findByPk(id);
    if (!cat) return null;
    return cat.update(data);
  }

  async deleteCategory(id: number) {
    const count = await Service.count({ where: { categoryId: id } });
    if (count > 0) {
      throw new AppError('Không thể xóa nhóm đang có dịch vụ liên kết', HttpStatus.BAD_REQUEST);
    }
    const cat = await ServiceCategory.findByPk(id);
    if (!cat) return false;
    await cat.destroy();
    return true;
  }

  // ── Services ──
  async findAndCount(options: {
    where?: WhereOptions;
    limit: number;
    offset: number;
  }) {
    return Service.findAndCountAll({
      where: options.where,
      include: [
        {
          model: ServiceCategory,
          as: 'category',
          attributes: ['id', 'code', 'name'],
        },
      ],
      order: [['id', 'DESC']],
      limit: options.limit,
      offset: options.offset,
      distinct: true,
    });
  }

  async findById(id: number) {
    return Service.findByPk(id, {
      include: [
        {
          model: ServiceCategory,
          as: 'category',
          attributes: ['id', 'code', 'name'],
        },
      ],
    });
  }

  async createService(data: any) {
    return Service.create(data);
  }

  async updateService(id: number, data: any) {
    const service = await Service.findByPk(id);
    if (!service) return null;
    return service.update(data);
  }

  async deleteService(id: number) {
    const service = await Service.findByPk(id);
    if (!service) return false;
    await service.destroy();
    return true;
  }

  async getNextCode(): Promise<string> {
    const last = await Service.findOne({ order: [['id', 'DESC']] });
    const nextNum = last ? last.id + 1 : 1;
    return `SVC-${String(nextNum).padStart(3, '0')}`;
  }

  buildSearchWhere(keyword?: string, categoryId?: number): WhereOptions | undefined {
    const conditions: any[] = [];

    if (keyword?.trim()) {
      const kw = `%${keyword.trim()}%`;
      conditions.push({
        [Op.or]: [
          { name: { [Op.like]: kw } },
          { code: { [Op.like]: kw } },
        ],
      });
    }

    if (categoryId) {
      conditions.push({ categoryId });
    }

    if (conditions.length === 0) return undefined;
    if (conditions.length === 1) return conditions[0];
    return { [Op.and]: conditions } as any;
  }
}

export const serviceRepository = new ServiceRepository();
