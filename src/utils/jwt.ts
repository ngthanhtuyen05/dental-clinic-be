import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import type { JwtPayload } from '../types/index.js';

// Re-export type để các file khác import từ đây nếu cần
export type { JwtPayload };

export const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export const signAccessToken = (id: number): string => {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as any);
};

export const signRefreshToken = (id: number): string => {
  return jwt.sign({ id }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as any);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
};
