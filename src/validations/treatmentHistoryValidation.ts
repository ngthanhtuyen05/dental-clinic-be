import { z } from 'zod';

export const createTreatmentHistorySchema = z.object({
  body: z.object({
    dentistId: z.number({ message: 'dentistId is required' }),
    diagnosis: z.string({ message: 'diagnosis is required' }).min(1, 'Diagnosis cannot be empty'),
    treatment: z.string({ message: 'treatment is required' }).min(1, 'Treatment cannot be empty'),
    cost: z.number({ message: 'cost is required' }).nonnegative('Cost must be positive'),
    treatmentDate: z.string().datetime().or(z.date()).optional(),
    notes: z.string().optional(),
  }),
});

export const updateTreatmentHistorySchema = z.object({
  body: z.object({
    diagnosis: z.string().min(1, 'Diagnosis cannot be empty').optional(),
    treatment: z.string().min(1, 'Treatment cannot be empty').optional(),
    cost: z.number().nonnegative('Cost must be positive').optional(),
    treatmentDate: z.string().datetime().or(z.date()).optional(),
    notes: z.string().optional(),
  }),
});
