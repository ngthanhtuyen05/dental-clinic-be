import { Request, Response, NextFunction } from 'express';
import { getAllAppointments, createNewAppointment } from '../services/appointmentService.js';
import { AppointmentResponseDto } from '../dtos/appointmentDto.js';

export const getAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appointments = await getAllAppointments();
    res.status(200).json({
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
      res.status(404).json({
        status: 'fail',
        message: 'Patient or Dentist not found',
      });
      return;
    }

    res.status(201).json({
      status: 'success',
      data: { appointment: new AppointmentResponseDto(newAppointment) },
    });
  } catch (error) {
    next(error);
  }
};

