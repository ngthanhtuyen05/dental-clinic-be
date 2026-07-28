import { Request, Response, NextFunction } from 'express';
import env from '../config/env.js';
import HttpStatus from '../constants/httpStatus.js';
import Messages from '../constants/messages.js';
import AppError from '../utils/AppError.js';

/**
 * Middleware xử lý route không tồn tại (404 Not Found)
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(Messages.SERVER.ROUTE_NOT_FOUND(req.originalUrl), HttpStatus.NOT_FOUND));
};

/**
 * Middleware xử lý lỗi tập trung (Global Error Handler)
 *
 * - Development: trả full error + stack trace để debug
 * - Production: ẩn chi tiết lỗi hệ thống, chỉ trả message an toàn
 */
export const globalErrorHandler = (err: any, _req: Request, res: Response, _next: NextFunction): void => {
  let statusCode = err.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
  let status = err.status || 'error';
  let message = err.message || Messages.SERVER.INTERNAL_ERROR;
  let isOperational = err.isOperational;

  // Xử lý các lỗi dữ liệu từ Sequelize
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors?.[0]?.path || 'trường dữ liệu';
    const val = err.errors?.[0]?.value || '';
    message = `Giá trị "${val}" của trường ${field} đã được sử dụng. Vui lòng nhập giá trị khác!`;
    statusCode = HttpStatus.CONFLICT;
    status = 'fail';
    isOperational = true;
  } else if (err.name === 'SequelizeValidationError') {
    const msg = err.errors?.[0]?.message || 'Dữ liệu không hợp lệ';
    message = `Lỗi dữ liệu: ${msg}`;
    statusCode = HttpStatus.BAD_REQUEST;
    status = 'fail';
    isOperational = true;
  } else if (err.name === 'SequelizeDatabaseError') {
    // Xử lý lỗi sai định dạng dữ liệu (ví dụ: sai kiểu dữ liệu số, chuỗi quá dài...)
    console.error('[SequelizeDatabaseError]', err.message);
    message = 'Dữ liệu truyền vào không hợp lệ hoặc sai định dạng.';
    statusCode = HttpStatus.BAD_REQUEST;
    status = 'fail';
    isOperational = true;
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    console.error('[SequelizeForeignKeyConstraintError]', err.message);
    message = 'Khóa ngoại tham chiếu không tồn tại trong hệ thống.';
    statusCode = HttpStatus.BAD_REQUEST;
    status = 'fail';
    isOperational = true;
  }

  if (env.isDevelopment) {
    if (statusCode < 500 || isOperational) {
      res.status(statusCode).json({
        status,
        message,
      });
    } else {
      console.error('[ServerError]', err);
      res.status(statusCode).json({
        status,
        message: 'Có lỗi xảy ra từ hệ thống server.',
      });
    }
  } else {
    // Production Mode: Ẩn stack trace và thông tin nhạy cảm
    if (isOperational) {
      res.status(statusCode).json({
        status,
        message,
      });
    } else {
      console.error('[Error] Programming or unknown error:', err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: Messages.SERVER.INTERNAL_ERROR,
      });
    }
  }
};
