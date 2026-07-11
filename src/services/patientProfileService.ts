import { patientProfileRepository } from '../repositories/patientProfileRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { CreatePatientProfileDto, UpdatePatientProfileDto } from '../dtos/patientProfileDto.js';
import AppError from '../utils/AppError.js';
import { UserRole } from '../constants/enums.js';
import type { PatientProfileModel } from '../models/patientProfileModel.js';

export const getPatientProfileByUserId = async (userId: number): Promise<PatientProfileModel | null> => {
  return await patientProfileRepository.findByUserId(userId);
};

export const createPatientProfile = async (dto: CreatePatientProfileDto): Promise<PatientProfileModel> => {
  const { userId, ...profileData } = dto;

  // 1. Kiểm tra User tồn tại
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('Không tìm thấy người dùng này.', 404);
  }

  // 2. Chỉ bệnh nhân mới có hồ sơ
  if (user.role !== UserRole.PATIENT) {
    throw new AppError('Chỉ bệnh nhân mới có hồ sơ bệnh án.', 400);
  }

  // 3. Kiểm tra profile đã tồn tại chưa
  const existingProfile = await patientProfileRepository.findByUserId(userId);
  if (existingProfile) {
    throw new AppError('Hồ sơ bệnh án cho người dùng này đã tồn tại.', 400);
  }

  return await patientProfileRepository.create({
    userId,
    dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : undefined,
    gender: profileData.gender,
    emergencyContactName: profileData.emergencyContactName,
    emergencyContactPhone: profileData.emergencyContactPhone,
    bloodType: profileData.bloodType,
    allergies: profileData.allergies,
    chronicDiseases: profileData.chronicDiseases,
    currentMedications: profileData.currentMedications,
    isSmoking: profileData.isSmoking ?? false,
    hasBruxism: profileData.hasBruxism ?? false,
    isPregnant: profileData.isPregnant ?? false,
    dentalHistory: profileData.dentalHistory,
    chiefComplaint: profileData.chiefComplaint,
  });
};

export const updatePatientProfile = async (userId: number, dto: UpdatePatientProfileDto): Promise<PatientProfileModel> => {
  const profile = await patientProfileRepository.findByUserId(userId);
  if (!profile) {
    throw new AppError('Không tìm thấy hồ sơ bệnh án cho người dùng này.', 404);
  }

  return await patientProfileRepository.update(profile, {
    dateOfBirth: dto.dateOfBirth !== undefined ? (dto.dateOfBirth ? new Date(dto.dateOfBirth) : null) : undefined,
    gender: dto.gender,
    emergencyContactName: dto.emergencyContactName,
    emergencyContactPhone: dto.emergencyContactPhone,
    bloodType: dto.bloodType,
    allergies: dto.allergies,
    chronicDiseases: dto.chronicDiseases,
    currentMedications: dto.currentMedications,
    isSmoking: dto.isSmoking,
    hasBruxism: dto.hasBruxism,
    isPregnant: dto.isPregnant,
    dentalHistory: dto.dentalHistory,
    chiefComplaint: dto.chiefComplaint,
  });
};
