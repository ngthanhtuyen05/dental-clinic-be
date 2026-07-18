import { Request, Response, NextFunction } from 'express';
import * as specialtyService from '../services/specialtyService.js';
import HttpStatus from '../constants/httpStatus.js';

export const getSpecialties = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const list = await specialtyService.getSpecialties();
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: list.map(item => ({
        id: item.id,
        name: item.name,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const createSpecialty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const item = await specialtyService.createSpecialty(req.body);
    res.status(HttpStatus.CREATED).json({
      status: 'success',
      data: {
        id: item.id,
        name: item.name,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateSpecialty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const item = await specialtyService.updateSpecialty(id, req.body);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: {
        id: item.id,
        name: item.name,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSpecialty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await specialtyService.deleteSpecialty(id);
    res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'Xóa chuyên khoa thành công',
    });
  } catch (error) {
    next(error);
  }
};
