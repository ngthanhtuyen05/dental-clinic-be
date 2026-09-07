import { Op } from 'sequelize';
import { UsageGuide } from '../models/index.js';
import AppError from '../utils/AppError.js';
import HttpStatus from '../constants/httpStatus.js';

export const getUsageGuides = async (keyword?: string, activeOnly?: boolean) => {
  const where: any = {};
  if (activeOnly) {
    where.isActive = true;
  }
  if (keyword && keyword.trim()) {
    const kw = `%${keyword.trim()}%`;
    where[Op.or] = [
      { title: { [Op.like]: kw } },
      { category: { [Op.like]: kw } },
      { content: { [Op.like]: kw } },
    ];
  }
  return UsageGuide.findAll({
    where,
    order: [['createdAt', 'DESC']],
  });
};

export const createUsageGuide = async (data: any) => {
  return UsageGuide.create(data);
};

export const getUsageGuideById = async (id: number) => {
  const guide = await UsageGuide.findByPk(id);
  if (!guide) {
    throw new AppError('Không tìm thấy hướng dẫn sử dụng', HttpStatus.NOT_FOUND);
  }
  return guide;
};

export const updateUsageGuide = async (id: number, data: any) => {
  const guide = await getUsageGuideById(id);
  await guide.update(data);
  return guide;
};

export const deleteUsageGuide = async (id: number) => {
  const guide = await getUsageGuideById(id);
  try {
    await guide.destroy();
  } catch {
    await guide.update({ isActive: false });
  }
  return { message: 'Đã xóa hướng dẫn sử dụng thành công' };
};
