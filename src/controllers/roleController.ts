import { Request, Response, NextFunction } from 'express';
import * as roleService from '../services/roleService.js';
import HttpStatus from '../constants/httpStatus.js';

const formatRole = (role: any) => ({
  id: role.id,
  name: role.name,
  code: role.code,
  color: role.color || 'blue',
  description: role.description || '',
  userCount: Number(role.get ? role.get('userCount') : role.userCount || 0),
  isSystem: Boolean(role.isSystem),
  permissions: Array.isArray(role.permissions) ? role.permissions : [],
  createdAt: role.createdAt,
  updatedAt: role.updatedAt,
});

export const getRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const search = (req.query.search || req.query.keyword || req.query.q) as string | undefined;
    const list = await roleService.getRoles(search);
    res.status(HttpStatus.OK).json({
      status: 'success',
      results: list.length,
      data: list.map(formatRole),
    });
  } catch (error) {
    next(error);
  }
};

export const getRoleDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const idOrCode = req.params.id as string;
    const role = await roleService.getRoleDetail(idOrCode);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: formatRole(role),
    });
  } catch (error) {
    next(error);
  }
};

export const createRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const role = await roleService.createRole(req.body);
    res.status(HttpStatus.CREATED).json({
      status: 'success',
      data: formatRole(role),
    });
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const idOrCode = req.params.id as string;
    const role = await roleService.updateRole(idOrCode, req.body);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: formatRole(role),
    });
  } catch (error) {
    next(error);
  }
};

export const updatePermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const idOrCode = req.params.id as string;
    const { permissions } = req.body;
    const role = await roleService.updatePermissions(idOrCode, permissions);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: formatRole(role),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const idOrCode = req.params.id as string;
    await roleService.deleteRole(idOrCode);
    res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'Đã xóa vai trò thành công',
    });
  } catch (error) {
    next(error);
  }
};
