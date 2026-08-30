import { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './authMiddleware.js';
import { Role } from '../models/index.js';
import AppError from '../utils/AppError.js';
import HttpStatus from '../constants/httpStatus.js';
import { UserRole } from '../constants/enums.js';

/**
 * Middleware kiểm tra quyền hạn RBAC động.
 * @param requiredPermissions Một hoặc nhiều quyền cần có (nếu truyền mảng: yêu cầu có ít nhất 1 hoặc toàn bộ tùy cờ requireAll)
 */
export const checkPermission = (
  requiredPermissions: string | string[],
  requireAll: boolean = false
) => {
  const perms = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AppError('Vui lòng đăng nhập để tiếp tục', HttpStatus.UNAUTHORIZED));
      }

      // Tìm Role theo roleId hoặc role code của user
      let roleRecord = null;
      if (req.user.roleId) {
        roleRecord = await Role.findByPk(req.user.roleId);
      }
      if (!roleRecord && req.user.role) {
        roleRecord = await Role.findOne({ where: { code: req.user.role } });
      }

      // Nếu không tìm thấy bản ghi Role trong DB và user là Admin thì cho phép mặc định
      if (!roleRecord) {
        if (req.user.role === UserRole.ADMIN) {
          return next();
        }
        return next(
          new AppError('Tài khoản chưa được gán vai trò hợp lệ trong hệ thống', HttpStatus.FORBIDDEN)
        );
      }

      const assignedPerms = (roleRecord.permissions as string[]) || [];

      // Kiểm tra xem vai trò có chứa quyền yêu cầu hay không
      const hasPermission = requireAll
        ? perms.every((p) => assignedPerms.includes(p))
        : perms.some((p) => assignedPerms.includes(p));

      if (!hasPermission) {
        return next(
          new AppError(
            `Bạn không có quyền thực hiện thao tác này (yêu cầu quyền: ${perms.join(', ')})`,
            HttpStatus.FORBIDDEN
          )
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
