import { z } from 'zod';
import { AppointmentStatus, AppointmentType } from '../constants/enums.js';

export const createAppointmentSchema = z.object({
  body: z.object({
    patientId: z.number().positive().optional(),
    dentistId: z.union([z.number(), z.string()]).optional(),
    serviceId: z.union([z.number(), z.string()]),
    appointmentDate: z.string({ message: 'Appointment date is required' }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    startTime: z.string({ message: 'Start time is required' }).regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format'),
    type: z.nativeEnum(AppointmentType).optional().default(AppointmentType.REGULAR),
    fullName: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    chiefComplaint: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateAppointmentSchema = z.object({
  body: z.object({
    patientId: z.number().positive().optional(),
    dentistId: z.number().positive().optional(),
    serviceId: z.number().positive().optional(),
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
