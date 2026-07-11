import { z } from 'zod';

const patientProfileBody = {
  dateOfBirth: z.string().or(z.date()).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  emergencyContactName: z.string().max(100).optional(),
  emergencyContactPhone: z.string().max(20).optional(),
  bloodType: z.string().max(10).optional(),
  allergies: z.string().optional(),
  chronicDiseases: z.string().optional(),
  currentMedications: z.string().optional(),
  isSmoking: z.boolean().optional(),
  hasBruxism: z.boolean().optional(),
  isPregnant: z.boolean().optional(),
  dentalHistory: z.string().optional(),
  chiefComplaint: z.string().optional(),
};

export const createPatientProfileSchema = z.object({
  body: z.object({
    userId: z.number({ message: 'userId is required' }),
    ...patientProfileBody,
  }),
});

export const updatePatientProfileSchema = z.object({
  body: z.object({
    ...patientProfileBody,
  }),
});
