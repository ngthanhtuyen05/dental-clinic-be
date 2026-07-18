import { Request, Response, NextFunction } from 'express';
import * as patientProfileService from '../services/patientProfileService.js';
import { PatientProfileResponseDto } from '../dtos/patientProfileDto.js';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import AppError from '../utils/AppError.js';
import { UserRole } from '../constants/enums.js';
import HttpStatus from '../constants/httpStatus.js';
import Messages from '../constants/messages.js';

export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId as string, 10);
    const authReq = req as AuthenticatedRequest;

    // Phân quyền: Chỉ admin, dentist, staff hoặc chính bệnh nhân đó mới được xem
    if (authReq.user && authReq.user.role === UserRole.PATIENT && authReq.user.id !== userId) {
      throw new AppError('Bạn không có quyền xem hồ sơ bệnh án của người khác.', HttpStatus.FORBIDDEN);
    }

    const profile = await patientProfileService.getPatientProfileByUserId(userId);
    if (!profile) {
      res.status(HttpStatus.NOT_FOUND).json({
        status: 'fail',
        message: Messages.CRUD.NOT_FOUND('Hồ sơ bệnh án'),
      });
      return;
    }

    res.status(HttpStatus.OK).json({
      status: 'success',
      data: { profile: new PatientProfileResponseDto(profile) },
    });
  } catch (error) {
    next(error);
  }
};

export const createProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    // Bảo mật: Nếu là bệnh nhân, tự động ghi đè userId bằng chính ID của mình để tránh việc tạo hồ sơ cho người khác
    if (authReq.user && authReq.user.role === UserRole.PATIENT) {
      req.body.userId = authReq.user.id;
    }

    const profile = await patientProfileService.createPatientProfile(req.body);
    res.status(HttpStatus.CREATED).json({
      status: 'success',
      data: { profile: new PatientProfileResponseDto(profile) },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId as string, 10);
    const authReq = req as AuthenticatedRequest;

    // Phân quyền: Chỉ admin, dentist, staff hoặc chính bệnh nhân đó mới có quyền sửa
    if (authReq.user && authReq.user.role === UserRole.PATIENT && authReq.user.id !== userId) {
      throw new AppError('Bạn không có quyền cập nhật hồ sơ của người khác.', HttpStatus.FORBIDDEN);
    }

    const profile = await patientProfileService.updatePatientProfile(userId, req.body);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: { profile: new PatientProfileResponseDto(profile) },
    });
  } catch (error) {
    next(error);
  }
};
