import { supplierRepository } from '../repositories/supplierRepository.js';
import AppError from '../utils/AppError.js';
import HttpStatus from '../constants/httpStatus.js';

interface GetSuppliersParams {
  page: number;
  limit: number;
  keyword?: string;
}

export const getAllSuppliers = async (params: GetSuppliersParams) => {
  const { page, limit, keyword } = params;
  const offset = (page - 1) * limit;
  const where = supplierRepository.buildSearchWhere(keyword);

  const { rows, count } = await supplierRepository.findAndCount({ where, limit, offset });

  return {
    suppliers: rows,
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit),
  };
};

export const getSupplierById = async (id: number) => {
  const supplier = await supplierRepository.findById(id);
  if (!supplier) {
    throw new AppError('Không tìm thấy nhà cung cấp', HttpStatus.NOT_FOUND);
  }
  return supplier;
};

export const createSupplier = async (data: any) => {
  // Kiểm tra trùng tên
  const existing = await supplierRepository.findByName(data.name);
  if (existing) {
    throw new AppError('Nhà cung cấp với tên này đã tồn tại', HttpStatus.CONFLICT);
  }
  return supplierRepository.create(data);
};

export const updateSupplier = async (id: number, data: any) => {
  // Kiểm tra trùng tên nếu đổi tên
  if (data.name) {
    const existing = await supplierRepository.findByName(data.name);
    if (existing && existing.id !== id) {
      throw new AppError('Nhà cung cấp với tên này đã tồn tại', HttpStatus.CONFLICT);
    }
  }

  const supplier = await supplierRepository.update(id, data);
  if (!supplier) {
    throw new AppError('Không tìm thấy nhà cung cấp để cập nhật', HttpStatus.NOT_FOUND);
  }
  return supplier;
};

export const deleteSupplier = async (id: number) => {
  const success = await supplierRepository.delete(id);
  if (!success) {
    throw new AppError('Không tìm thấy nhà cung cấp để xóa', HttpStatus.NOT_FOUND);
  }
  return true;
};
