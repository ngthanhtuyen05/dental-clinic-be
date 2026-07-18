export class StaffResponseDto {
  id: number;
  code: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  specialty: string | null;
  hireDate: string | null;
  address: string | null;
  notes: string | null;
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
    this.hireDate = staff.staffProfile?.hireDate || null;
    this.address = staff.staffProfile?.address || null;
    this.notes = staff.staffProfile?.notes || null;
    this.createdAt = staff.createdAt;
    this.updatedAt = staff.updatedAt;
  }

  static toList(staffList: any[]): StaffResponseDto[] {
    return staffList.map((s) => new StaffResponseDto(s));
  }
}
