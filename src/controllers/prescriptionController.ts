import { Request, Response, NextFunction } from 'express';
import * as prescriptionService from '../services/prescriptionService.js';
import HttpStatus from '../constants/httpStatus.js';

export const getPrescriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const keyword = (req.query.keyword as string) || '';
    const status = (req.query.status as string) || undefined;
    const patientProfileId = req.query.patientProfileId ? Number(req.query.patientProfileId) : undefined;

    const result = await prescriptionService.getPrescriptions({ page, limit, keyword, status, patientProfileId });

    res.status(HttpStatus.OK).json({
      status: 'success',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getPrescription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const prescription = await prescriptionService.getPrescriptionById(id);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: prescription,
    });
  } catch (error) {
    next(error);
  }
};

export const createPrescription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dentistId = (req as any).user?.id || req.body.dentistId || 1;
    const prescription = await prescriptionService.createPrescription({
      ...req.body,
      dentistId,
    });
    res.status(HttpStatus.CREATED).json({
      status: 'success',
      data: prescription,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePrescriptionStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    const updated = await prescriptionService.updatePrescriptionStatus(id, status);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const getDosageTemplates = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const templates = await prescriptionService.getDosageTemplates();
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: templates,
    });
  } catch (error) {
    next(error);
  }
};

export const createDosageTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const template = await prescriptionService.createDosageTemplate(req.body);
    res.status(HttpStatus.CREATED).json({
      status: 'success',
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

export const getUsageGuides = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const guides = await prescriptionService.getUsageGuides();
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: guides,
    });
  } catch (error) {
    next(error);
  }
};

export const createUsageGuide = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const guide = await prescriptionService.createUsageGuide(req.body);
    res.status(HttpStatus.CREATED).json({
      status: 'success',
      data: guide,
    });
  } catch (error) {
    next(error);
  }
};
