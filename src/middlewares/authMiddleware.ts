import { Request, Response, NextFunction } from 'express';
import type { UserModel } from '../models/userModel.js';
import { userRepository } from '../repositories/userRepository.js';
import AppError from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { UserRole } from '../constants/enums.js';

export interface AuthenticatedRequest extends Request {
  user?: UserModel;
}

export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. Lấy token từ header Authorization
    let token: string | undefined;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Bạn chưa đăng nhập! Vui lòng đăng nhập để truy cập.', 401));
    }

    // 2. Xác thực token
    const decoded = verifyAccessToken(token);

    // 3. Kiểm tra xem user có còn tồn tại không
    const currentUser = await userRepository.findById(decoded.id, { includePassword: false });
    if (!currentUser) {
      return next(new AppError('Tài khoản liên kết với token này đã bị xóa.', 401));
    }

    // 4. Lưu thông tin user vào request để dùng ở các middleware/controller tiếp theo
    req.user = currentUser;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Token không hợp lệ! Vui lòng đăng nhập lại.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Phiên đăng nhập đã hết hạn! Vui lòng làm mới token.', 401));
    }
    next(error);
  }
};

export const restrictTo = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Bạn chưa đăng nhập!', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Bạn không có quyền truy cập tài nguyên này.', 403));
    }

    next();
  };
};

export const restrictToOwnerOrAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new AppError('Bạn chưa đăng nhập!', 401));
  }

  const userIdParam = parseInt(req.params.id as string, 10);

  // Nếu là Admin thì được phép đi tiếp
  if (req.user.role === UserRole.ADMIN) {
    return next();
  }

  // Nếu không phải Admin, kiểm tra xem ID của user đăng nhập có trùng với ID trong params hay không
  if (req.user.id !== userIdParam) {
    return next(new AppError('Bạn không có quyền cập nhật thông tin của người khác.', 403));
  }

  next();
};
