import { roleRepository } from '../repositories/roleRepository.js';
import AppError from '../utils/AppError.js';
import HttpStatus from '../constants/httpStatus.js';

export const getRoles = async (search?: string) => {
  return roleRepository.findAll(search);
};

export const getRoleDetail = async (idOrCode: string | number) => {
  const role = await roleRepository.findByIdOrCode(idOrCode);
  if (!role) {
    throw new AppError('Không tìm thấy vai trò', HttpStatus.NOT_FOUND);
  }
  return role;
};

export const createRole = async (data: {
  name: string;
  code: string;
  color?: string;
  description?: string | null;
  cloneFrom?: string | null;
}) => {
  // 1. Kiểm tra tính duy nhất của mã code
  const existing = await roleRepository.findByCode(data.code);
  if (existing) {
    throw new AppError('Mã định danh vai trò này đã tồn tại trong hệ thống', HttpStatus.CONFLICT);
  }

  // 2. Nếu có cloneFrom, lấy permissions từ role nguồn
  let initialPermissions: string[] = [];
  if (data.cloneFrom) {
    const sourceRole = await roleRepository.findByIdOrCode(data.cloneFrom);
    if (sourceRole && sourceRole.permissions) {
      initialPermissions = [...(sourceRole.permissions as string[])];
    }
  }

  return roleRepository.create({
    name: data.name,
    code: data.code.toLowerCase().trim(),
    color: data.color || 'blue',
    description: data.description || '',
    isSystem: false,
    permissions: initialPermissions,
  });
};

export const updateRole = async (
  idOrCode: string | number,
  data: { name?: string; color?: string; description?: string | null }
) => {
  const role = await roleRepository.findByIdOrCode(idOrCode);
  if (!role) {
    throw new AppError('Không tìm thấy vai trò để cập nhật', HttpStatus.NOT_FOUND);
  }

  const updated = await roleRepository.update(role.id, data);
  return updated;
};

export const updatePermissions = async (idOrCode: string | number, permissions: string[]) => {
  const role = await roleRepository.findByIdOrCode(idOrCode);
  if (!role) {
    throw new AppError('Không tìm thấy vai trò để cập nhật quyền', HttpStatus.NOT_FOUND);
  }

  const updated = await roleRepository.update(role.id, { permissions });
  return updated;
};

export const deleteRole = async (idOrCode: string | number) => {
  const role = await roleRepository.findByIdOrCode(idOrCode);
  if (!role) {
    throw new AppError('Không tìm thấy vai trò để xóa', HttpStatus.NOT_FOUND);
  }

  if (role.isSystem) {
    throw new AppError('Không thể xóa vai trò mặc định của hệ thống', HttpStatus.BAD_REQUEST);
  }

  const userCount = Number((role.get('userCount') as number) || 0);
  if (userCount > 0) {
    throw new AppError(
      `Không thể xóa vai trò này vì hiện đang có ${userCount} nhân sự đang áp dụng`,
      HttpStatus.BAD_REQUEST
    );
  }

  await roleRepository.delete(role.id);
  return true;
};
