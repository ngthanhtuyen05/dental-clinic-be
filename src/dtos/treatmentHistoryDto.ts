import { TreatmentHistoryModel } from '../models/treatmentHistoryModel.js';
import { PatientProfileResponseDto } from './patientProfileDto.js';
import { UserResponseDto } from './userDto.js';

export interface CreateTreatmentHistoryDto {
  patientProfileId: number;
  dentistId: number;
  diagnosis: string;
  treatment: string;
  cost: number;
  treatmentDate?: Date | string;
  notes?: string;
}

export interface UpdateTreatmentHistoryDto {
  diagnosis?: string;
  treatment?: string;
  cost?: number;
  treatmentDate?: Date | string;
  notes?: string;
}

export class TreatmentHistoryResponseDto {
  public id: number;
  public patientProfileId: number;
  public dentistId: number;
  public diagnosis: string;
  public treatment: string;
  public cost: number;
  public treatmentDate: Date;
  public notes: string | null;
  public createdAt: Date;
  public patientProfile?: PatientProfileResponseDto;
  public dentist?: UserResponseDto;
  /** Đơn thuốc đã kê trong lần khám này (FE hiển thị ở ngăn "Đơn thuốc liên quan"). */
  public prescriptions: any[];

  constructor(model: TreatmentHistoryModel) {
    this.id = model.id;
    this.patientProfileId = model.patientProfileId;
    this.dentistId = model.dentistId;
    this.diagnosis = model.diagnosis;
    this.treatment = model.treatment;
    this.cost = Number(model.cost);
    this.treatmentDate = model.treatmentDate;
    this.notes = model.notes;
    this.createdAt = model.createdAt || new Date();

    this.prescriptions = (model as any).prescriptions || [];

    const patientProfileModel = (model as any).patientProfile;
    const dentistModel = (model as any).dentist;
    if (patientProfileModel) {
      this.patientProfile = new PatientProfileResponseDto(patientProfileModel);
    }
    if (dentistModel) {
      this.dentist = new UserResponseDto(dentistModel);
    }
  }

  static toList(list: TreatmentHistoryModel[]): TreatmentHistoryResponseDto[] {
    return list.map((item) => new TreatmentHistoryResponseDto(item));
  }
}
