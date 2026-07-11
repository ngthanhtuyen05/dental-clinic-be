import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService.js';
import { UserResponseDto } from '../dtos/userDto.js';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { UserRole } from '../constants/enums.js';

export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: { users: UserResponseDto.toList(users) },
    });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const user = await userService.getUserById(id);
    
    if (!user) {
      res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { user: new UserResponseDto(user) },
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const newUser = await userService.createNewUser(req.body);
    res.status(201).json({
      status: 'success',
      data: { user: new UserResponseDto(newUser) },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    
    // Bảo mật: Nếu không phải Admin, không được tự thay đổi role của mình/người khác
    const updateData = { ...req.body };
    const authReq = req as AuthenticatedRequest;
    if (authReq.user && authReq.user.role !== UserRole.ADMIN) {
      delete updateData.role;
    }

    const updatedUser = await userService.updateUser(id, updateData);
    
    if (!updatedUser) {
      res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { user: new UserResponseDto(updatedUser) },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const success = await userService.deleteUser(id);
    
    if (!success) {
      res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
      return;
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
