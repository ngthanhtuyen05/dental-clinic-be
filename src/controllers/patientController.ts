import { Request, Response, NextFunction } from 'express';
import * as patientService from '../services/patientService.js';
import { PatientResponseDto } from '../dtos/patientDto.js';
import HttpStatus from '../constants/httpStatus.js';

export const getPatients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const keyword = (req.query.keyword as string) || '';
    const status = (req.query.status as string) || '';

    const result = await patientService.getAllPatients({ page, limit, keyword, status });
    const formatted = PatientResponseDto.toList(result.patients);

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

export const getPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const patient = await patientService.getPatientById(id);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: new PatientResponseDto(patient),
    });
  } catch (error) {
    next(error);
  }
};

export const createPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patient = await patientService.createNewPatient(req.body);
    res.status(HttpStatus.CREATED).json({
      status: 'success',
      data: new PatientResponseDto(patient),
    });
  } catch (error) {
    next(error);
  }
};

export const updatePatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const patient = await patientService.updatePatient(id, req.body);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: new PatientResponseDto(patient),
    });
  } catch (error) {
    next(error);
  }
};

export const deletePatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    await patientService.deletePatient(id);
    res.status(HttpStatus.NO_CONTENT).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const togglePatientStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const patient = await patientService.togglePatientStatus(id);
    res.status(HttpStatus.OK).json({
      status: 'success',
      data: new PatientResponseDto(patient),
    });
  } catch (error) {
    next(error);
  }
};
