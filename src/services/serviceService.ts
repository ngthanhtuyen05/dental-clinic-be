import { serviceRepository } from '../repositories/serviceRepository.js';

// ══════════════════════════════════════
// CATEGORIES
// ══════════════════════════════════════

export const getAllCategories = async () => {
  return serviceRepository.findAllCategories();
};

export const createCategory = async (data: { name: string; description?: string }) => {
  // Auto-generate code from name: "Nha khoa Phục hồi" → "NHAKH"
  const code = data.name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-zA-Z0-9]/g, '')                     // Remove special chars
    .substring(0, 5)
    .toUpperCase();

  // Ensure unique code
  const existing = await serviceRepository.findAllCategories();
  let uniqueCode = code;
  let suffix = 1;
  while (existing.some((c: any) => c.code === uniqueCode)) {
    uniqueCode = `${code.substring(0, 4)}${suffix}`;
    suffix++;
  }

  const sortOrder = existing.length + 1;
  return serviceRepository.createCategory({ ...data, code: uniqueCode, sortOrder });
};

export const updateCategory = async (id: number, data: any) => {
  const cat = await serviceRepository.updateCategory(id, data);
  if (!cat) throw new Error('Không tìm thấy nhóm dịch vụ');
  return cat;
};

export const deleteCategory = async (id: number) => {
  const result = await serviceRepository.deleteCategory(id);
  if (!result) throw new Error('Không tìm thấy nhóm dịch vụ');
};

// ══════════════════════════════════════
// SERVICES
// ══════════════════════════════════════

interface GetServicesParams {
  page: number;
  limit: number;
  keyword?: string;
  categoryId?: number;
}

export const getAllServices = async (params: GetServicesParams) => {
  const { page, limit, keyword, categoryId } = params;
  const offset = (page - 1) * limit;
  const where = serviceRepository.buildSearchWhere(keyword, categoryId);

  const { rows, count } = await serviceRepository.findAndCount({ where, limit, offset });

  return {
    services: rows,
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit),
  };
};

export const getServiceById = async (id: number) => {
  const service = await serviceRepository.findById(id);
  if (!service) throw new Error('Không tìm thấy dịch vụ');
  return service;
};

export const createService = async (data: any) => {
  // Auto-generate code
  const code = await serviceRepository.getNextCode();
  return serviceRepository.createService({ ...data, code });
};

export const updateService = async (id: number, data: any) => {
  const service = await serviceRepository.updateService(id, data);
  if (!service) throw new Error('Không tìm thấy dịch vụ');
  return service;
};

export const deleteService = async (id: number) => {
  const result = await serviceRepository.deleteService(id);
  if (!result) throw new Error('Không tìm thấy dịch vụ');
};
