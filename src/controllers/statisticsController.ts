import { Request, Response, NextFunction } from 'express';
import HttpStatus from '../constants/httpStatus.js';
import * as statisticsService from '../services/statisticsService.js';

/**
 * GET /api/statistics/appointments
 * Lấy dữ liệu thống kê phân hệ Lịch hẹn khám
 */
export const getAppointmentStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const timeRange = (req.query.timeRange as string) || 'month';
    const startDate = (req.query.startDate as string) || (req.query.dateFrom as string) || undefined;
    const endDate = (req.query.endDate as string) || (req.query.dateTo as string) || undefined;
    const dentistId = req.query.dentistId ? (req.query.dentistId === 'all' ? 'all' : Number(req.query.dentistId)) : undefined;

    const data = await statisticsService.getAppointmentStatistics({
      timeRange,
      startDate,
      endDate,
      dentistId,
    });

    res.status(HttpStatus.OK).json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/statistics/clinical
 * Lấy dữ liệu thống kê phân hệ Lâm sàng & Điều trị
 */
export const getClinicalStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const timeRange = (req.query.timeRange as string) || 'month';
    const startDate = (req.query.startDate as string) || (req.query.dateFrom as string) || undefined;
    const endDate = (req.query.endDate as string) || (req.query.dateTo as string) || undefined;
    const specialtyId = req.query.specialtyId ? String(req.query.specialtyId) : undefined;
    const dentistId = req.query.dentistId ? (req.query.dentistId === 'all' ? 'all' : Number(req.query.dentistId)) : undefined;

    const data = await statisticsService.getClinicalStatistics({
      timeRange,
      startDate,
      endDate,
      specialtyId,
      dentistId,
    });

    res.status(HttpStatus.OK).json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};
