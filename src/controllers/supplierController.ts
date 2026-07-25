import { Request, Response, NextFunction } from 'express';
import * as supplierService from '../services/supplierService.js';
import { SupplierResponseDto } from '../dtos/supplierDto.js';
import HttpStatus from '../constants/httpStatus.js';

export const getSuppliers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const keyword = (req.query.keyword as string) || '';

    const result = await supplierService.getAllSuppliers({ page, limit, keyword });
    const formatted = SupplierResponseDto.toList(result.suppliers);

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

export const getSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const supplier = await supplierService.getSupplierById(id);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: new SupplierResponseDto(supplier),
    });
  } catch (error) {
    next(error);
  }
};

export const createSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const supplier = await supplierService.createSupplier(req.body);
    res.status(HttpStatus.CREATED).json({
      status: 'success',
      data: new SupplierResponseDto(supplier),
    });
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const supplier = await supplierService.updateSupplier(id, req.body);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: new SupplierResponseDto(supplier),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await supplierService.deleteSupplier(id);
    res.status(HttpStatus.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};
