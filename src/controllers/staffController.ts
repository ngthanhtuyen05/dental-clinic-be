import { Request, Response, NextFunction } from 'express';
import * as staffService from '../services/staffService.js';
import { StaffResponseDto } from '../dtos/staffDto.js';
import HttpStatus from '../constants/httpStatus.js';

/**
 * GET /api/staff
 * Lấy danh sách nhân viên (paginated, filterable)
 */
export const getStaffList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const keyword = (req.query.keyword as string) || '';
    const role = (req.query.role as string) || undefined;
    const status = (req.query.status as string) || undefined;

    const result = await staffService.getAllStaff({ page, limit, keyword, role, status });
    const formatted = StaffResponseDto.toList(result.staff);

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
      roleCounts: result.roleCounts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/staff/stats
 * Role stats cho sidebar filter
 */
export const getStaffStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await staffService.getStaffStats();
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/staff/:id
 */
export const getStaffDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const staff = await staffService.getStaffById(id);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: new StaffResponseDto(staff),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/staff
 */
export const createStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const staff = await staffService.createStaff(req.body);
    res.status(HttpStatus.CREATED).json({
      status: 'success',
      data: staff ? new StaffResponseDto(staff) : null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/staff/:id
 */
export const updateStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const staff = await staffService.updateStaff(id, req.body);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: new StaffResponseDto(staff),
    });
  } catch (error) {
    next(error);
  }
};
