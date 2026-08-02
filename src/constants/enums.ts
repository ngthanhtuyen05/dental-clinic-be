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

export enum InventoryCategory {
  MEDICINE = 'medicine',
  DENTAL_SUPPLY = 'dental_supply',
  NEEDLE = 'needle',
  GLOVE = 'glove',
  MASK = 'mask',
}

export enum ProductUnit {
  VIEN = 'vien',
  ONG = 'ong',
  LO = 'lo',
  HOP = 'hop',
  CAI = 'cai',
  GOI = 'goi',
  CUON = 'cuon',
  BO = 'bo',
  CHAI = 'chai',
}

export enum StockTransactionType {
  IMPORT = 'import',
  TREATMENT = 'treatment',
  DISPOSAL = 'disposal',
  ADJUSTMENT = 'adjustment',
}

export enum PrescriptionStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

export enum DosageFrequency {
  ONCE_DAILY = 'once_daily',
  TWICE_DAILY = 'twice_daily',
  THREE_TIMES_DAILY = 'three_times_daily',
  FOUR_TIMES_DAILY = 'four_times_daily',
  EVERY_6_HOURS = 'every_6_hours',
  EVERY_8_HOURS = 'every_8_hours',
  EVERY_12_HOURS = 'every_12_hours',
  AS_NEEDED = 'as_needed',
}

export enum MealRelation {
  BEFORE_MEAL = 'before_meal',
  AFTER_MEAL = 'after_meal',
  WITH_MEAL = 'with_meal',
  EMPTY_STOMACH = 'empty_stomach',
  ANY_TIME = 'any_time',
}

export enum InvoiceStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  MOMO = 'momo',
}


