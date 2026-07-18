import { Request } from 'express';
import type { UserModel } from '../models/userModel.js';

// ============================================================
// Mở rộng Express Request để gắn thông tin user đã xác thực
// ============================================================
export interface AuthenticatedRequest extends Request {
  user?: UserModel;
}

// ============================================================
// Common Types — dùng chung cho pagination, query, response
// ============================================================

/** Query params chuẩn cho các endpoint có phân trang */
export interface PaginationQuery {
  page: number;
  limit: number;
  keyword?: string;
}

/** Response metadata chuẩn cho danh sách có phân trang */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Cấu trúc response thành công chuẩn của API */
export interface ApiResponse<T = any> {
  status: 'success';
  message?: string;
  data?: T;
  results?: number;
  pagination?: PaginationMeta;
}

/** Cấu trúc response lỗi chuẩn của API */
export interface ApiErrorResponse {
  status: 'fail' | 'error';
  message: string;
  stack?: string;
  error?: any;
}

// ============================================================
// JWT Types
// ============================================================
export interface JwtPayload {
  id: number;
}
