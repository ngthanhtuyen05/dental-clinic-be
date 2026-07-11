import { appointmentRepository } from '../repositories/appointmentRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { CreateAppointmentRequestDto } from '../dtos/appointmentDto.js';
import type { AppointmentModel } from '../models/appointmentModel.js';

export const getAllAppointments = async (): Promise<AppointmentModel[]> => {
  return await appointmentRepository.findAll();
};

export const createNewAppointment = async (appointmentData: CreateAppointmentRequestDto): Promise<AppointmentModel | null> => {
  const { appointmentDate, patientId, dentistId, notes } = appointmentData;
  
  const patient = await userRepository.findById(patientId);
  const dentist = await userRepository.findById(dentistId);
  
  if (!patient || !dentist) {
    return null;
  }

  return await appointmentRepository.create({
    appointmentDate: new Date(appointmentDate),
    patientId,
    dentistId,
    notes,
  });
};
