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
      typeCounts: result.typeCounts,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductBatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const productId = Number(req.params.productId);
    const batches = await stockService.getProductBatches(productId);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: StockBatchResponseDto.toList(batches),
    });
  } catch (error) {
    next(error);
  }
};

export const consumeStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const result = await stockService.consumeStock({
      items: req.body.items,
      performedBy: userId,
      reason: req.body.reason,
    });
    res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'Xuất kho vật tư thành công',
      data: {
        totalItems: result.totalItems,
        totalQuantity: result.totalQuantity,
        transactions: StockTransactionResponseDto.toList(result.transactions),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const adjustStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const result = await stockService.adjustStock({
      productId: req.body.productId,
      actualQuantity: req.body.actualQuantity,
      performedBy: userId,
      reason: req.body.reason,
    });
    res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'Cân bằng tồn kho thành công',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getExpiryAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string, 10) || 60;
    const result = await stockService.getExpiryAlerts(days);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getInventoryStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await stockService.getInventoryStats();
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};


