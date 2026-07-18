import { Request, Response, NextFunction } from 'express';
import * as serviceService from '../services/serviceService.js';
import { ServiceResponseDto, ServiceCategoryResponseDto } from '../dtos/serviceDto.js';
import HttpStatus from '../constants/httpStatus.js';

// ══════════════════════════════════════
// CATEGORIES
// ══════════════════════════════════════

export const getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await serviceService.getAllCategories();
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: ServiceCategoryResponseDto.toList(categories),
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cat = await serviceService.createCategory(req.body);
    res.status(HttpStatus.CREATED).json({
      status: 'success',
      data: new ServiceCategoryResponseDto(cat),
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const cat = await serviceService.updateCategory(id, req.body);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: new ServiceCategoryResponseDto(cat),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await serviceService.deleteCategory(id);
    res.status(HttpStatus.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════
// SERVICES
// ══════════════════════════════════════

export const getServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const keyword = (req.query.keyword as string) || '';
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string, 10) : undefined;

    const result = await serviceService.getAllServices({ page, limit, keyword, categoryId });
    const formatted = ServiceResponseDto.toList(result.services);

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

export const getService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const service = await serviceService.getServiceById(id);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: new ServiceResponseDto(service),
    });
  } catch (error) {
    next(error);
  }
};

export const createService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const service = await serviceService.createService(req.body);
    // Reload with association
    const full = await serviceService.getServiceById(service.id);
    res.status(HttpStatus.CREATED).json({
      status: 'success',
      data: new ServiceResponseDto(full),
    });
  } catch (error) {
    next(error);
  }
};

export const updateService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await serviceService.updateService(id, req.body);
    const full = await serviceService.getServiceById(id);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: new ServiceResponseDto(full),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await serviceService.deleteService(id);
    res.status(HttpStatus.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};
