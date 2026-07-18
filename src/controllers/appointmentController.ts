import { Request, Response, NextFunction } from 'express';
import { getAllAppointments, createNewAppointment } from '../services/appointmentService.js';
import { AppointmentResponseDto } from '../dtos/appointmentDto.js';
import HttpStatus from '../constants/httpStatus.js';
import Messages from '../constants/messages.js';

export const getAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appointments = await getAllAppointments();
    res.status(HttpStatus.OK).json({
      status: 'success',
      results: appointments.length,
      data: { appointments: AppointmentResponseDto.toList(appointments) },
    });
  } catch (error) {
    next(error);
  }
};

export const createAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const newAppointment = await createNewAppointment(req.body);
    
    if (!newAppointment) {
      res.status(HttpStatus.NOT_FOUND).json({
        status: 'fail',
        message: Messages.CRUD.NOT_FOUND('Patient or Dentist'),
      });
      return;
    }

    res.status(HttpStatus.CREATED).json({
      status: 'success',
      data: { appointment: new AppointmentResponseDto(newAppointment) },
    });
  } catch (error) {
    next(error);
  }
};
