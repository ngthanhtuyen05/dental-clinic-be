import { Gender } from '../constants/enums.js';

// Request DTOs
export interface PatientQueryDto {
  page?: number;
  limit?: number;
  keyword?: string;
}

export interface CreatePatientRequestDto {
  fullName: string;
  email: string;
  phone?: string;
  gender?: Gender;
  dateOfBirth?: string;
  allergies?: string;
  chronicDiseases?: string;
  bloodType?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  currentMedications?: string;
  isSmoking?: boolean;
  hasBruxism?: boolean;
  isPregnant?: boolean;
  dentalHistory?: string;
  chiefComplaint?: string;
}

export interface UpdatePatientRequestDto {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  gender?: Gender;
  dateOfBirth?: string;
  allergies?: string;
  chronicDiseases?: string;
  bloodType?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  currentMedications?: string;
  isSmoking?: boolean;
  hasBruxism?: boolean;
  isPregnant?: boolean;
  dentalHistory?: string;
  chiefComplaint?: string;
}

export interface PaginatedPatientsDto {
  patients: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Response DTO
export class PatientResponseDto {
  public key: string;
  public id: string;
  public name: string;
  public email: string;
  public phone: string;
  public gender: string;
  public genderRaw: string;
  public age: number;
  public dateOfBirth: string;
  public history: string;
  public lastVisit: string;
  public status: 'active' | 'inactive';
  public profileDetails: Record<string, any>;

  constructor(patient: any) {
    const profile = patient.patientProfile;
    const genderMap: Record<string, string> = { male: 'Nam', female: 'Nữ', other: 'Khác' };

    // Tính tuổi
    const dob = profile?.dateOfBirth;
    const age = dob ? new Date().getFullYear() - new Date(dob).getFullYear() : 0;

    // Lấy ngày khám gần nhất
    const treatments = profile?.treatmentHistories || [];
    const lastVisit = treatments.length > 0
      ? treatments
          .map((t: any) => t.treatmentDate)
          .sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime())[0]
      : null;

    this.key = patient.id.toString();
    this.id = `BN${patient.id.toString().padStart(4, '0')}`;
    this.name = patient.fullName;
    this.email = patient.email;
    this.phone = patient.phone || '';
    this.gender = genderMap[profile?.gender] || 'Khác';
    this.genderRaw = profile?.gender || 'other';
    this.age = age;
    this.dateOfBirth = dob ? new Date(dob).toISOString().split('T')[0] : '';
    this.history = profile?.allergies || 'Không có';
    this.lastVisit = lastVisit ? new Date(lastVisit).toISOString().split('T')[0] : '';
    this.status = 'active';
    this.profileDetails = {
      emergencyContactName: profile?.emergencyContactName || '',
      emergencyContactPhone: profile?.emergencyContactPhone || '',
      bloodType: profile?.bloodType || '',
      allergies: profile?.allergies || '',
      chronicDiseases: profile?.chronicDiseases || '',
      currentMedications: profile?.currentMedications || '',
      isSmoking: profile?.isSmoking ?? false,
      hasBruxism: profile?.hasBruxism ?? false,
      isPregnant: profile?.isPregnant ?? false,
      dentalHistory: profile?.dentalHistory || '',
      chiefComplaint: profile?.chiefComplaint || '',
    };
  }

  static toList(patients: any[]): PatientResponseDto[] {
    return patients.map((p) => new PatientResponseDto(p));
  }
}
