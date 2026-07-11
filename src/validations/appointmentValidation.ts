import { z } from 'zod';

export const createAppointmentSchema = z.object({
  body: z.object({
    appointmentDate: z.string({ message: 'Appointment date is required' }).datetime({ message: 'Invalid ISO date string' }),
    patientId: z.number({ message: 'Patient ID is required' }).positive('Patient ID must be positive'),
    dentistId: z.number({ message: 'Dentist ID is required' }).positive('Dentist ID must be positive'),
    notes: z.string().optional(),
  }),
});
