import { Request, Response, NextFunction } from 'express';
import * as settingService from '../services/settingService.js';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import HttpStatus from '../constants/httpStatus.js';

export const getAllSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await settingService.getAllSettings();
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const getSettingByKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { key } = req.params;
    const setting = await settingService.getSettingByKey(key as string);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: setting,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSetting = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { key } = req.params;
    const value = req.body;
    const updatedBy = req.user?.id;

    const updated = await settingService.updateSetting(key as string, value, updatedBy);
    res.status(HttpStatus.OK).json({
      status: 'success',
      message: `Cập nhật cấu hình '${key}' thành công`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicClinicSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clinicInfo = await settingService.getPublicClinicInfo();
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: clinicInfo,
    });
  } catch (error) {
    next(error);
  }
};
