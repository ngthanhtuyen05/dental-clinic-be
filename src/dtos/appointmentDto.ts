import { UserResponseDto } from './userDto.js';

// Request DTO
export interface CreateAppointmentRequestDto {
  appointmentDate: string;
  patientId: number;
  dentistId: number;
  notes?: string;
}

// Response DTO
export class AppointmentResponseDto {
  public id: number;
  public appointmentDate: Date;
  public status: string;
  public notes: string | null;
  public patient?: UserResponseDto;
  public dentist?: UserResponseDto;
  public createdAt: Date;

  constructor(appointment: any) {
    this.id = appointment.id;
    this.appointmentDate = appointment.appointmentDate;
    this.status = appointment.status;
    this.notes = appointment.notes;
    this.createdAt = appointment.createdAt || new Date();

    if (appointment.patient) {
      this.patient = new UserResponseDto(appointment.patient);
    }
    if (appointment.dentist) {
      this.dentist = new UserResponseDto(appointment.dentist);
    }
  }

  static toList(appointments: any[]): AppointmentResponseDto[] {
    return appointments.map((appt) => new AppointmentResponseDto(appt));
  }
}
