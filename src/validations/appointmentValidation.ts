import { z } from 'zod';
import { AppointmentStatus, AppointmentType } from '../constants/enums.js';

export const createAppointmentSchema = z.object({
  body: z.object({
    patientId: z.number({ message: 'Patient ID must be a number' }).positive('Patient ID must be positive'),
    dentistId: z.number({ message: 'Dentist ID must be a number' }).positive('Dentist ID must be positive'),
    serviceId: z.number({ message: 'Service ID must be a number' }).positive('Service ID must be positive'),
    appointmentDate: z.string({ message: 'Appointment date is required' }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    startTime: z.string({ message: 'Start time is required' }).regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format'),
    type: z.nativeEnum(AppointmentType, { message: 'Invalid appointment type' }),
    chiefComplaint: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateAppointmentSchema = z.object({
  body: z.object({
    patientId: z.number().positive('Patient ID must be positive').optional(),
    dentistId: z.number().positive('Dentist ID must be positive').optional(),
    serviceId: z.number().positive('Service ID must be positive').optional(),
    appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format').optional(),
    type: z.nativeEnum(AppointmentType).optional(),
    chiefComplaint: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateAppointmentStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(AppointmentStatus, { message: 'Invalid status value' }),
    cancelReason: z.string().optional(),
  }),
});
