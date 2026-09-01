import { Request, Response, NextFunction } from 'express';
import * as labService from '../services/labService.js';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import HttpStatus from '../constants/httpStatus.js';

export const getAllOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      search,
      status,
      category,
      supplierId,
      dentistId,
      patientProfileId,
      urgentOnly,
      startDate,
      endDate,
      page,
      limit,
    } = req.query;

    const result = await labService.getAllOrders({
      search: search as string,
      status: status as string,
      category: category as string,
      supplierId: supplierId ? Number(supplierId) : undefined,
      dentistId: dentistId ? Number(dentistId) : undefined,
      patientProfileId: patientProfileId ? Number(patientProfileId) : undefined,
      urgentOnly: urgentOnly === 'true',
      startDate: startDate as string,
      endDate: endDate as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });

    res.status(HttpStatus.OK).json({
      status: 'success',
      data: result.data,
      pagination: result.pagination,
      stats: result.stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const order = await labService.getOrderById(id);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const createdBy = req.user?.id;
    const creatorName = req.user?.fullName || 'Hệ thống';
    const order = await labService.createOrder(req.body, createdBy, creatorName);
    res.status(HttpStatus.CREATED).json({
      status: 'success',
      message: 'Tạo đơn hàng Labo thành công',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const order = await labService.updateOrder(id, req.body);
    res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'Cập nhật đơn hàng Labo thành công',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { status, notes, actualDeliveryDate } = req.body;
    const performerName = req.user?.fullName || 'Hệ thống';

    const order = await labService.updateOrderStatus(id, status, notes, actualDeliveryDate, performerName);
    res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'Cập nhật trạng thái đơn Labo thành công',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { isPaidToLab } = req.body;
    const order = await labService.updateOrderPayment(id, isPaidToLab);
    res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'Cập nhật trạng thái thanh toán xưởng thành công',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    await labService.deleteOrder(id);
    res.status(HttpStatus.OK).json({
      status: 'success',
      message: 'Xóa đơn hàng Labo thành công',
    });
  } catch (error) {
    next(error);
  }
};

export const getSuppliers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const suppliers = await labService.getSuppliers();
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: suppliers,
    });
  } catch (error) {
    next(error);
  }
};

export const getWarrantyCards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, patientProfileId } = req.query;
    const cards = await labService.getWarrantyCards({
      search: search as string,
      patientProfileId: patientProfileId ? Number(patientProfileId) : undefined,
    });
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: cards,
    });
  } catch (error) {
    next(error);
  }
};

export const getWarrantyCardById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const card = await labService.getWarrantyCardById(id);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: card,
    });
  } catch (error) {
    next(error);
  }
};

export const createWarrantyCard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const card = await labService.createWarrantyCard(req.body);
    res.status(HttpStatus.CREATED).json({
      status: 'success',
      message: 'Cấp thẻ bảo hành phục hình thành công',
      data: card,
    });
  } catch (error) {
    next(error);
  }
};

export const getReconciliation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { supplierId, month } = req.query;
    if (!supplierId) {
      res.status(HttpStatus.BAD_REQUEST).json({
        status: 'fail',
        message: 'Vui lòng chọn xưởng Labo đối tác để đối soát',
      });
      return;
    }

    const summary = await labService.getReconciliation(Number(supplierId), month as string);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};
