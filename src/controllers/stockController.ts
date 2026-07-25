import { Request, Response, NextFunction } from 'express';
import * as stockService from '../services/stockService.js';
import { StockBatchResponseDto, StockTransactionResponseDto } from '../dtos/stockDto.js';
import HttpStatus from '../constants/httpStatus.js';
import type { StockTransactionType } from '../constants/enums.js';

export const importStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const result = await stockService.importStock({
      supplierId: req.body.supplierId,
      items: req.body.items,
      performedBy: userId,
    });

    res.status(HttpStatus.CREATED).json({
      status: 'success',
      data: {
        totalItems: result.totalItems,
        totalQuantity: result.totalQuantity,
        totalValue: result.totalValue,
        batches: StockBatchResponseDto.toList(result.batches),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const productId = req.query.productId ? Number(req.query.productId) : undefined;
    const type = (req.query.type as StockTransactionType) || undefined;

    const result = await stockService.getTransactions({ page, limit, productId, type });
    const formatted = StockTransactionResponseDto.toList(result.transactions);

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
