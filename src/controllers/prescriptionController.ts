import { Request, Response, NextFunction } from 'express';
import * as prescriptionService from '../services/prescriptionService.js';
import HttpStatus from '../constants/httpStatus.js';

export const getPrescriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const keyword = (req.query.keyword as string) || '';
    const status = (req.query.status as string) || undefined;
    const startDate = (req.query.startDate as string) || undefined;
    const endDate = (req.query.endDate as string) || undefined;
    const patientProfileId = req.query.patientProfileId ? Number(req.query.patientProfileId) : undefined;

    const result = await prescriptionService.getPrescriptions({ page, limit, keyword, status, startDate, endDate, patientProfileId });

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

export const getDosageTemplates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const keyword = (req.query.keyword as string) || undefined;
    const activeOnly = req.query.activeOnly === 'true';
    const templates = await prescriptionService.getDosageTemplates(keyword, activeOnly);
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

export const getDosageTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const template = await prescriptionService.getDosageTemplateById(id);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDosageTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const template = await prescriptionService.updateDosageTemplate(id, req.body);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDosageTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const result = await prescriptionService.deleteDosageTemplate(id);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUsageGuides = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const keyword = (req.query.keyword as string) || undefined;
    const guides = await prescriptionService.getUsageGuides(keyword);
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
