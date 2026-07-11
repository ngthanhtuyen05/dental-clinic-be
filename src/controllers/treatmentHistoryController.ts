import { Request, Response, NextFunction } from 'express';
import * as treatmentHistoryService from '../services/treatmentHistoryService.js';
import { patientProfileRepository } from '../repositories/patientProfileRepository.js';
import { TreatmentHistoryResponseDto } from '../dtos/treatmentHistoryDto.js';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import AppError from '../utils/AppError.js';
import { UserRole } from '../constants/enums.js';

export const getTreatmentsByProfileId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profileId = parseInt(req.params.patientProfileId as string, 10);
    const authReq = req as AuthenticatedRequest;

    // Phân quyền kiểm tra: Nếu là bệnh nhân, phải là người sở hữu profile đó
    if (authReq.user && authReq.user.role === UserRole.PATIENT) {
      const profile = await patientProfileRepository.findById(profileId);
      if (!profile || profile.userId !== authReq.user.id) {
        throw new AppError('Bạn không có quyền xem lịch sử điều trị của hồ sơ này.', 403);
      }
    }

    const list = await treatmentHistoryService.getTreatmentHistoriesByProfileId(profileId);
    res.status(200).json({
      status: 'success',
      results: list.length,
      data: { treatments: TreatmentHistoryResponseDto.toList(list) },
    });
  } catch (error) {
    next(error);
  }
};

export const createTreatment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profileId = parseInt(req.params.patientProfileId as string, 10);
    const authReq = req as AuthenticatedRequest;

    // Nếu nha sĩ tạo lịch hẹn, tự gán dentistId là chính mình (nếu không truyền cụ thể)
    const payload = {
      ...req.body,
      patientProfileId: profileId,
    };
    
    if (authReq.user && authReq.user.role === UserRole.DENTIST && !payload.dentistId) {
      payload.dentistId = authReq.user.id;
    }

    const record = await treatmentHistoryService.createTreatmentHistory(payload);
    res.status(201).json({
      status: 'success',
      data: { treatment: new TreatmentHistoryResponseDto(record) },
    });
  } catch (error) {
    next(error);
  }
};

export const getTreatmentDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const authReq = req as AuthenticatedRequest;
    
    const record = await treatmentHistoryService.getTreatmentHistoryById(id);

    // Phân quyền kiểm tra: Nếu là bệnh nhân, phải là người sở hữu profile trong record
    if (authReq.user && authReq.user.role === UserRole.PATIENT) {
      if (record.patientProfile && record.patientProfile.userId !== authReq.user.id) {
        throw new AppError('Bạn không có quyền xem chi tiết đợt điều trị này.', 403);
      }
    }

    res.status(200).json({
      status: 'success',
      data: { treatment: new TreatmentHistoryResponseDto(record) },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTreatment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const authReq = req as AuthenticatedRequest;
    
    const record = await treatmentHistoryService.getTreatmentHistoryById(id);

    // Phân quyền kiểm tra: Chỉ admin hoặc nha sĩ trực tiếp điều trị mới được sửa
    if (authReq.user && authReq.user.role !== UserRole.ADMIN) {
      if (authReq.user.role !== UserRole.DENTIST || record.dentistId !== authReq.user.id) {
        throw new AppError('Bạn không có quyền chỉnh sửa đợt điều trị này.', 403);
      }
    }

    const updatedRecord = await treatmentHistoryService.updateTreatmentHistory(id, req.body);
    res.status(200).json({
      status: 'success',
      data: { treatment: new TreatmentHistoryResponseDto(updatedRecord) },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTreatment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    await treatmentHistoryService.deleteTreatmentHistory(id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
