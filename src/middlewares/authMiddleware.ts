import { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { userRepository } from '../repositories/userRepository.js';
import AppError from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { UserRole } from '../constants/enums.js';
import HttpStatus from '../constants/httpStatus.js';
import Messages from '../constants/messages.js';

// Re-export để các file khác import từ đây không bị break
export type { AuthenticatedRequest };

export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. Lấy token từ header Authorization
    let token: string | undefined;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError(Messages.AUTH.UNAUTHORIZED, HttpStatus.UNAUTHORIZED));
    }

    // 2. Xác thực token
    const decoded = verifyAccessToken(token);

    // 3. Kiểm tra xem user có còn tồn tại không
    const currentUser = await userRepository.findById(decoded.id, { includePassword: false });
    if (!currentUser) {
      return next(new AppError(Messages.AUTH.ACCOUNT_DELETED, HttpStatus.UNAUTHORIZED));
    }

    // 4. Lưu thông tin user vào request để dùng ở các middleware/controller tiếp theo
    req.user = currentUser;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError(Messages.AUTH.TOKEN_INVALID, HttpStatus.UNAUTHORIZED));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError(Messages.AUTH.TOKEN_EXPIRED, HttpStatus.UNAUTHORIZED));
    }
    next(error);
  }
};

export const restrictTo = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(Messages.AUTH.UNAUTHORIZED, HttpStatus.UNAUTHORIZED));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new AppError(Messages.AUTH.FORBIDDEN, HttpStatus.FORBIDDEN));
    }

    next();
  };
};

export const restrictToOwnerOrAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new AppError(Messages.AUTH.UNAUTHORIZED, HttpStatus.UNAUTHORIZED));
  }

  const userIdParam = parseInt(req.params.id as string, 10);

  // Nếu là Admin thì được phép đi tiếp
  if (req.user.role === UserRole.ADMIN) {
    return next();
  }

  // Nếu không phải Admin, kiểm tra xem ID của user đăng nhập có trùng với ID trong params hay không
  if (req.user.id !== userIdParam) {
    return next(new AppError(Messages.AUTH.FORBIDDEN_UPDATE, HttpStatus.FORBIDDEN));
  }

  next();
};
