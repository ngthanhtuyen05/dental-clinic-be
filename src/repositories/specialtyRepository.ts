import { Specialty } from '../models/index.js';

export class SpecialtyRepository {
  async findAll() {
    return Specialty.findAll({
      order: [['name', 'ASC']],
    });
  }

  async findById(id: number) {
    return Specialty.findByPk(id);
  }

  async findByName(name: string) {
    return Specialty.findOne({ where: { name } });
  }

  async create(data: { name: string }) {
    return Specialty.create(data);
  }

  async update(id: number, data: { name: string }) {
    const specialty = await Specialty.findByPk(id);
    if (!specialty) return null;
    return specialty.update(data);
  }

  async delete(id: number) {
    const specialty = await Specialty.findByPk(id);
    if (!specialty) return false;
    await specialty.destroy();
    return true;
  }
}

export const specialtyRepository = new SpecialtyRepository();
