export class StaffResponseDto {
  id: number;
  code: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  specialty: string | null;
  specialtyId: number | null;
  specialtyName: string | null;
  hireDate: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  address: string | null;
  notes: string | null;
  academicTitle: string | null;
  licenseNumber: string | null;
  licenseDate: string | null;
  experienceYears: number;
  avatar: string | null;
  badge: string | null;
  bio: string | null;
  quote: string | null;
  education: any[] | null;
  certificates: any[] | null;
  achievements: any[] | null;
  workingSchedule: string | null;
  slotDuration: number;
  subSpecialties: string[] | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(staff: any) {
    this.id = staff.id;
    this.code = staff.staffProfile?.staffCode || '';
    this.fullName = staff.fullName;
    this.email = staff.email;
    this.phone = staff.phone || null;
    this.role = staff.role;
    this.status = staff.staffProfile?.staffStatus || 'active';
    this.specialty = staff.staffProfile?.specialty || null;
    this.specialtyId = staff.staffProfile?.specialtyId || null;
    this.specialtyName = staff.staffProfile?.specialtyInfo?.name || null;
    this.hireDate = staff.staffProfile?.hireDate || null;
    this.gender = staff.staffProfile?.gender || null;
    this.dateOfBirth = staff.staffProfile?.dateOfBirth || null;
    this.address = staff.staffProfile?.address || null;
    this.notes = staff.staffProfile?.notes || null;
    this.academicTitle = staff.staffProfile?.academicTitle || null;
    this.licenseNumber = staff.staffProfile?.licenseNumber || null;
    this.licenseDate = staff.staffProfile?.licenseDate || null;
    this.experienceYears = staff.staffProfile?.experienceYears || 0;
    this.avatar = staff.staffProfile?.avatar || null;
    this.badge = staff.staffProfile?.badge || null;
    this.bio = staff.staffProfile?.bio || null;
    this.quote = staff.staffProfile?.quote || null;
    this.education = staff.staffProfile?.education || [];
    this.certificates = staff.staffProfile?.certificates || [];
    this.achievements = staff.staffProfile?.achievements || [];
    this.workingSchedule = staff.staffProfile?.workingSchedule || null;
    this.slotDuration = staff.staffProfile?.slotDuration || 30;
    this.subSpecialties = staff.staffProfile?.subSpecialties || [];
    this.createdAt = staff.createdAt;
    this.updatedAt = staff.updatedAt;
  }

  static toList(staffList: any[]): StaffResponseDto[] {
    return staffList.map((s) => new StaffResponseDto(s));
  }
}
