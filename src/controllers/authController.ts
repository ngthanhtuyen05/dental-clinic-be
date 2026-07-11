import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService.js';
import { UserResponseDto } from '../dtos/userDto.js';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { accessToken, refreshToken, user } = await authService.loginUser(req.body);
    res.status(200).json({
      status: 'success',
      accessToken,
      refreshToken,
      data: { user: new UserResponseDto(user) },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    const tokens = await authService.refreshUserToken(token);

    res.status(200).json({
      status: 'success',
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { accessToken, refreshToken, user } = await authService.registerUser(req.body);
    res.status(201).json({
      status: 'success',
      accessToken,
      refreshToken,
      data: { user: new UserResponseDto(user) },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (token) {
      await authService.logoutUser(token);
    }
    res.status(200).json({
      status: 'success',
      message: 'Đăng xuất thành công',
    });
  } catch (error) {
    next(error);
  }
};
