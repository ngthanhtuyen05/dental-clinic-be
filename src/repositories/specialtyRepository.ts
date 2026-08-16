import { Op } from 'sequelize';
import { Specialty } from '../models/index.js';
import { slugify } from '../utils/slugify.js';

export class SpecialtyRepository {
  async findAll(search?: string) {
    const where: any = {};
    if (search?.trim()) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search.trim()}%` } },
        { slug: { [Op.like]: `%${search.trim()}%` } },
      ];
    }

    return Specialty.findAll({
      where,
      order: [['name', 'ASC']],
    });
  }

  async findById(id: number) {
    return Specialty.findByPk(id);
  }

  async findByName(name: string) {
    return Specialty.findOne({ where: { name } });
  }

  async findBySlug(slug: string) {
    return Specialty.findOne({ where: { slug } });
  }

  async create(data: { name: string; slug?: string }) {
    const slug = data.slug || slugify(data.name);
    return Specialty.create({ ...data, slug });
  }

  async update(id: number, data: { name: string; slug?: string }) {
    const specialty = await Specialty.findByPk(id);
    if (!specialty) return null;
    const slug = data.slug || slugify(data.name);
    return specialty.update({ ...data, slug });
  }

  async delete(id: number) {
    const specialty = await Specialty.findByPk(id);
    if (!specialty) return false;
    await specialty.destroy();
    return true;
  }
}

export const specialtyRepository = new SpecialtyRepository();
