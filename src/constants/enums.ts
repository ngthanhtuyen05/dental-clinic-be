export enum UserRole {
  ADMIN = 'admin',
  DENTIST = 'dentist',
  STAFF = 'staff',
  PATIENT = 'patient',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PatientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum ServiceUnit {
  TOOTH = 'tooth',
  JAW = 'jaw',
  SESSION = 'session',
  SET = 'set',
}

export enum StaffStatus {
  ACTIVE = 'active',
  ON_LEAVE = 'on_leave',
  RESIGNED = 'resigned',
}
