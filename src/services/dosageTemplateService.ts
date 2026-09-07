import { Op } from 'sequelize';
import { DosageTemplate } from '../models/index.js';
import AppError from '../utils/AppError.js';
import HttpStatus from '../constants/httpStatus.js';

export const getDosageTemplates = async (keyword?: string, activeOnly?: boolean) => {
  const where: any = {};
  if (activeOnly) {
    where.isActive = true;
  }
  if (keyword && keyword.trim()) {
    const kw = `%${keyword.trim()}%`;
    where[Op.or] = [
      { name: { [Op.like]: kw } },
      { instruction: { [Op.like]: kw } },
    ];
  }
  return DosageTemplate.findAll({
    where,
    order: [['createdAt', 'DESC']],
  });
};

export const createDosageTemplate = async (data: any) => {
  return DosageTemplate.create(data);
};

export const getDosageTemplateById = async (id: number) => {
  const template = await DosageTemplate.findByPk(id);
  if (!template) {
    throw new AppError('Không tìm thấy mẫu liều dùng', HttpStatus.NOT_FOUND);
  }
  return template;
};

export const updateDosageTemplate = async (id: number, data: any) => {
  const template = await getDosageTemplateById(id);
  await template.update(data);
  return template;
};

export const deleteDosageTemplate = async (id: number) => {
  const template = await getDosageTemplateById(id);
  try {
    await template.destroy();
  } catch {
    await template.update({ isActive: false });
  }
  return { message: 'Đã xóa mẫu liều dùng thành công' };
};
