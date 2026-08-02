import { Request, Response, NextFunction } from 'express';
import * as appointmentService from '../services/appointmentService.js';
import { AppointmentResponseDto } from '../dtos/appointmentDto.js';
import HttpStatus from '../constants/httpStatus.js';
import Messages from '../constants/messages.js';
import { AppointmentStatus, AppointmentType, UserRole } from '../constants/enums.js';

export const getAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const keyword = (req.query.keyword as string) || '';
    const status = (req.query.status as AppointmentStatus) || undefined;
    const type = (req.query.type as AppointmentType) || undefined;
    const dateFrom = (req.query.dateFrom as string) || undefined;
    const dateTo = (req.query.dateTo as string) || undefined;
    const appointmentDate = (req.query.appointmentDate as string) || undefined;
    const patientId = req.query.patientId ? parseInt(req.query.patientId as string, 10) : undefined;

    const currentUser = (req as any).user;
    let doctorId = req.query.doctorId ? parseInt(req.query.doctorId as string, 10) : undefined;

    // Nếu tài khoản đang đăng nhập là Bác sĩ -> Tự động lọc theo duy nhất Bác sĩ đó
    if (currentUser && currentUser.role === UserRole.DENTIST) {
      doctorId = currentUser.id;
    }

    const result = await appointmentService.getAllAppointments({
      page,
      limit,
      keyword,
      status,
      type,
      doctorId,
      patientId,
      dateFrom,
      dateTo,
      appointmentDate,
    });

    const formatted = AppointmentResponseDto.toList(result.appointments);

    res.status(HttpStatus.OK).json({
      status: 'success',
      results: formatted.length,
      data: formatted,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const appointment = await appointmentService.getAppointmentById(id);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: new AppointmentResponseDto(appointment),
    });
  } catch (error) {
    next(error);
  }
};

export const createAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Lấy ID người tạo từ middleware bảo mật (protect)
    const currentUserId = (req as any).user?.id;
    
    const appointment = await appointmentService.createNewAppointment(req.body, currentUserId);
    res.status(HttpStatus.CREATED).json({
      status: 'success',
      data: new AppointmentResponseDto(appointment),
    });
  } catch (error) {
    next(error);
  }
};

export const updateAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const appointment = await appointmentService.updateAppointment(id, req.body);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: new AppointmentResponseDto(appointment),
    });
  } catch (error) {
    next(error);
  }
};

export const updateAppointmentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { status, cancelReason } = req.body;
    
    const appointment = await appointmentService.updateAppointmentStatus(id, status, cancelReason);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: new AppointmentResponseDto(appointment),
    });
  } catch (error) {
    next(error);
  }
};

export const getTodayStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const currentUser = (req as any).user;
    let doctorId: number | undefined = undefined;
    if (currentUser && currentUser.role === UserRole.DENTIST) {
      doctorId = currentUser.id;
    }

    const stats = await appointmentService.getTodayStats(doctorId);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getAvailableSlots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dentistId = parseInt(req.query.dentistId as string, 10);
    const date = req.query.date as string;

    if (isNaN(dentistId) || !date) {
      res.status(HttpStatus.BAD_REQUEST).json({
        status: 'fail',
        message: 'Thiếu thông tin bác sĩ (dentistId) hoặc ngày khám (date)',
      });
      return;
    }

    const slots = await appointmentService.getAvailableSlots(dentistId, date);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const currentUserId = (req as any).user?.id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const status = (req.query.status as AppointmentStatus) || undefined;
    const keyword = (req.query.keyword as string) || '';

    const result = await appointmentService.getMyAppointments(currentUserId, { page, limit, status, keyword });
    const formatted = AppointmentResponseDto.toList(result.appointments);

    res.status(HttpStatus.OK).json({
      status: 'success',
      results: formatted.length,
      data: formatted,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};
