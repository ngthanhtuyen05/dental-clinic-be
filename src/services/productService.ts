import { productRepository } from '../repositories/productRepository.js';
import AppError from '../utils/AppError.js';
import HttpStatus from '../constants/httpStatus.js';
import type { InventoryCategory } from '../constants/enums.js';

interface GetProductsParams {
  page: number;
  limit: number;
  keyword?: string;
  category?: InventoryCategory;
  status?: string;
}

export const getAllProducts = async (params: GetProductsParams) => {
  const { page, limit, keyword, category, status } = params;
  const offset = (page - 1) * limit;
  const where = productRepository.buildSearchWhere({ keyword, category, status });

  const { rows, count } = await productRepository.findAndCount({ where, limit, offset });

  return {
    products: rows,
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit),
  };
};

export const getProductById = async (id: number) => {
  const product = await productRepository.findById(id);
  if (!product) {
    throw new AppError('Không tìm thấy sản phẩm', HttpStatus.NOT_FOUND);
  }
  return product;
};

export const createProduct = async (data: any) => {
  // Kiểm tra trùng tên trong cùng category
  const existing = await productRepository.findByNameInCategory(data.name, data.category);
  if (existing) {
    throw new AppError('Sản phẩm với tên này đã tồn tại trong cùng danh mục', HttpStatus.CONFLICT);
  }

  // Auto-generate code
  const code = await productRepository.generateCode(data.category);

  return productRepository.create({ ...data, code });
};

export const updateProduct = async (id: number, data: any) => {
  if (data.name || data.category) {
    const current = await productRepository.findById(id);
    if (!current) throw new AppError('Không tìm thấy sản phẩm để cập nhật', HttpStatus.NOT_FOUND);

    const checkName = data.name || current.name;
    const checkCat = data.category || current.category;
    const existing = await productRepository.findByNameInCategory(checkName, checkCat);
    if (existing && existing.id !== id) {
      throw new AppError('Sản phẩm với tên này đã tồn tại trong cùng danh mục', HttpStatus.CONFLICT);
    }
  }

  const product = await productRepository.update(id, data);
  if (!product) {
    throw new AppError('Không tìm thấy sản phẩm để cập nhật', HttpStatus.NOT_FOUND);
  }
  return product;
};

export const deleteProduct = async (id: number) => {
  const success = await productRepository.delete(id);
  if (!success) {
    throw new AppError('Không tìm thấy sản phẩm để xóa', HttpStatus.NOT_FOUND);
  }
  return true;
};
