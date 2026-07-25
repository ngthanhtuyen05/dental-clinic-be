import { Request, Response, NextFunction } from 'express';
import * as productService from '../services/productService.js';
import { ProductResponseDto } from '../dtos/productDto.js';
import HttpStatus from '../constants/httpStatus.js';
import type { InventoryCategory } from '../constants/enums.js';

export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const keyword = (req.query.keyword as string) || '';
    const category = (req.query.category as InventoryCategory) || undefined;
    const status = (req.query.status as string) || undefined;

    const result = await productService.getAllProducts({ page, limit, keyword, category, status });
    const formatted = ProductResponseDto.toList(result.products);

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

export const getProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const product = await productService.getProductById(id);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: new ProductResponseDto(product),
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(HttpStatus.CREATED).json({
      status: 'success',
      data: new ProductResponseDto(product),
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const product = await productService.updateProduct(id, req.body);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: new ProductResponseDto(product),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await productService.deleteProduct(id);
    res.status(HttpStatus.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};
