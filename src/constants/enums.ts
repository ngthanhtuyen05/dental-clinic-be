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
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum AppointmentType {
  REGULAR = 'regular',
  WALK_IN = 'walk_in',
  FOLLOW_UP = 'follow_up',
  EMERGENCY = 'emergency',
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
