import { specialtyRepository } from '../repositories/specialtyRepository.js';
import AppError from '../utils/AppError.js';
import HttpStatus from '../constants/httpStatus.js';

export const getSpecialties = async () => {
  return specialtyRepository.findAll();
};

export const getSpecialtyById = async (id: number) => {
  const spec = await specialtyRepository.findById(id);
  if (!spec) {
    throw new AppError('Không tìm thấy chuyên khoa', HttpStatus.NOT_FOUND);
  }
  return spec;
};

export const createSpecialty = async (data: { name: string }) => {
  const existing = await specialtyRepository.findByName(data.name);
  if (existing) {
    throw new AppError('Chuyên khoa này đã tồn tại', HttpStatus.CONFLICT);
  }
  return specialtyRepository.create(data);
};

export const updateSpecialty = async (id: number, data: { name: string }) => {
  const existing = await specialtyRepository.findByName(data.name);
  if (existing && existing.id !== id) {
    throw new AppError('Chuyên khoa này đã tồn tại', HttpStatus.CONFLICT);
  }
  
  const result = await specialtyRepository.update(id, data);
  if (!result) {
    throw new AppError('Không tìm thấy chuyên khoa để cập nhật', HttpStatus.NOT_FOUND);
  }
  return result;
};

export const deleteSpecialty = async (id: number) => {
  const success = await specialtyRepository.delete(id);
  if (!success) {
    throw new AppError('Không tìm thấy chuyên khoa để xóa', HttpStatus.NOT_FOUND);
  }
  return true;
};
