import { treatmentHistoryRepository } from '../repositories/treatmentHistoryRepository.js';
import { patientProfileRepository } from '../repositories/patientProfileRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { CreateTreatmentHistoryDto, UpdateTreatmentHistoryDto } from '../dtos/treatmentHistoryDto.js';
import AppError from '../utils/AppError.js';
import { UserRole } from '../constants/enums.js';
import type { TreatmentHistoryModel } from '../models/treatmentHistoryModel.js';

export const createTreatmentHistory = async (dto: CreateTreatmentHistoryDto): Promise<TreatmentHistoryModel> => {
  const { patientProfileId, dentistId, diagnosis, treatment, cost, treatmentDate, notes } = dto;

  // 1. Kiểm tra xem PatientProfile có tồn tại không
  const profile = await patientProfileRepository.findById(patientProfileId);
  if (!profile) {
    throw new AppError('Không tìm thấy hồ sơ bệnh nhân tương ứng.', 404);
  }

  // 2. Kiểm tra xem Nha sĩ có tồn tại và đúng vai trò DENTIST không
  const dentist = await userRepository.findById(dentistId);
  if (!dentist) {
    throw new AppError('Không tìm thấy nha sĩ được chỉ định.', 404);
  }
  if (dentist.role !== UserRole.DENTIST) {
    throw new AppError('Người thực hiện điều trị phải là nha sĩ.', 400);
  }

  return await treatmentHistoryRepository.create({
    patientProfileId,
    dentistId,
    diagnosis,
    treatment,
    cost,
    treatmentDate: treatmentDate ? new Date(treatmentDate) : new Date(),
    notes,
  });
};

export const getTreatmentHistoriesByProfileId = async (patientProfileId: number): Promise<TreatmentHistoryModel[]> => {
  // Đảm bảo hồ sơ bệnh án tồn tại
  const profile = await patientProfileRepository.findById(patientProfileId);
  if (!profile) {
    throw new AppError('Không tìm thấy hồ sơ bệnh nhân tương ứng.', 404);
  }

  return await treatmentHistoryRepository.findByProfileId(patientProfileId);
};

export const getTreatmentHistoryById = async (id: number): Promise<TreatmentHistoryModel> => {
  const record = await treatmentHistoryRepository.findById(id);
  if (!record) {
    throw new AppError('Không tìm thấy bản ghi lịch sử điều trị.', 404);
  }
  return record;
};

export const updateTreatmentHistory = async (id: number, dto: UpdateTreatmentHistoryDto): Promise<TreatmentHistoryModel> => {
  const record = await treatmentHistoryRepository.findById(id);
  if (!record) {
    throw new AppError('Không tìm thấy bản ghi lịch sử điều trị.', 404);
  }

  return await treatmentHistoryRepository.update(record, {
    diagnosis: dto.diagnosis,
    treatment: dto.treatment,
    cost: dto.cost,
    treatmentDate: dto.treatmentDate ? new Date(dto.treatmentDate) : undefined,
    notes: dto.notes,
  });
};

export const deleteTreatmentHistory = async (id: number): Promise<void> => {
  const record = await treatmentHistoryRepository.findById(id);
  if (!record) {
    throw new AppError('Không tìm thấy bản ghi lịch sử điều trị.', 404);
  }
  await treatmentHistoryRepository.delete(record);
};
