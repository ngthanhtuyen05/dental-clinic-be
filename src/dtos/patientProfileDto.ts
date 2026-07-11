import { PatientProfileModel } from '../models/patientProfileModel.js';
import { UserResponseDto } from './userDto.js';
import { Gender } from '../constants/enums.js';

export interface CreatePatientProfileDto {
  userId: number;
  dateOfBirth?: Date | string;
  gender?: Gender;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: string;
  allergies?: string;
  chronicDiseases?: string;
  currentMedications?: string;
  isSmoking?: boolean;
  hasBruxism?: boolean;
  isPregnant?: boolean;
  dentalHistory?: string;
  chiefComplaint?: string;
}

export interface UpdatePatientProfileDto {
  dateOfBirth?: Date | string;
  gender?: Gender;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: string;
  allergies?: string;
  chronicDiseases?: string;
  currentMedications?: string;
  isSmoking?: boolean;
  hasBruxism?: boolean;
  isPregnant?: boolean;
  dentalHistory?: string;
  chiefComplaint?: string;
}

export class PatientProfileResponseDto {
  public id: number;
  public userId: number;
  public dateOfBirth: Date | string | null;
  public gender: Gender | null;
  public emergencyContactName: string | null;
  public emergencyContactPhone: string | null;
  public bloodType: string | null;
  public allergies: string | null;
  public chronicDiseases: string | null;
  public currentMedications: string | null;
  public isSmoking: boolean;
  public hasBruxism: boolean;
  public isPregnant: boolean;
  public dentalHistory: string | null;
  public chiefComplaint: string | null;
  public createdAt: Date;
  public user?: UserResponseDto;

  constructor(model: PatientProfileModel) {
    this.id = model.id;
    this.userId = model.userId;
    this.dateOfBirth = model.dateOfBirth;
    this.gender = model.gender;
    this.emergencyContactName = model.emergencyContactName;
    this.emergencyContactPhone = model.emergencyContactPhone;
    this.bloodType = model.bloodType;
    this.allergies = model.allergies;
    this.chronicDiseases = model.chronicDiseases;
    this.currentMedications = model.currentMedications;
    this.isSmoking = model.isSmoking;
    this.hasBruxism = model.hasBruxism;
    this.isPregnant = model.isPregnant;
    this.dentalHistory = model.dentalHistory;
    this.chiefComplaint = model.chiefComplaint;
    this.createdAt = model.createdAt || new Date();

    const userModel = (model as any).user;
    if (userModel) {
      this.user = new UserResponseDto(userModel);
    }
  }
}
