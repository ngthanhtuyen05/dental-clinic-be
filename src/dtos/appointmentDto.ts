import { UserResponseDto } from './userDto.js';
import { AppointmentStatus, AppointmentType } from '../constants/enums.js';

// Request DTOs
export interface CreateAppointmentRequestDto {
  patientId?: number;
  dentistId?: number | string;
  serviceId: number | string;
  appointmentDate: string;
  startTime: string;
  type?: AppointmentType;
  fullName?: string;
  phone?: string;
  email?: string;
  chiefComplaint?: string;
  notes?: string;
  createdBy?: number;
}

export interface UpdateAppointmentRequestDto {
  patientId?: number | string;
  dentistId?: number | string;
  serviceId?: number | string;
  appointmentDate?: string;
  startTime?: string;
  type?: AppointmentType;
  chiefComplaint?: string;
  notes?: string;
}

export interface UpdateAppointmentStatusRequestDto {
  status: AppointmentStatus;
  cancelReason?: string;
  notes?: string;
  /** Số lượng đơn vị đã điều trị thực tế (VD: số răng đã bọc sứ) — chỉ có ý nghĩa khi status = completed. */
  treatedQuantity?: number;
}

export interface AppointmentQueryParamsDto {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: AppointmentStatus;
  type?: AppointmentType;
  doctorId?: number;
  patientId?: number;
  dateFrom?: string;
  dateTo?: string;
  appointmentDate?: string;
}

// Response DTOs
export interface PaginatedAppointmentsDto {
  appointments: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class AppointmentResponseDto {
  public id: number;
  public code: string;
  public patientId: number;
  public patientName: string;
  public patientPhone: string;
  public patientEmail: string;

  public doctorId: number;
  public doctorName: string;

  public serviceId: number;
  public serviceName: string;
  public servicePrice: number;
  public serviceUnit?: string;
  public service?: { id: number; name: string; price: number; unit?: string };

  public appointmentDate: string;
  public startTime: string;
  public endTime: string;
  public durationMinutes: number;

  public status: AppointmentStatus;
  public type: AppointmentType;

  public chiefComplaint: string | null;
  public notes: string | null;
  public cancelReason: string | null;

  public checkedInAt: Date | null;
  public startedAt: Date | null;
  public completedAt: Date | null;
  public cancelledAt: Date | null;

  public createdAt: Date;
  public updatedAt: Date;
  public createdBy: number | null;
  public prescriptions?: any[];

  constructor(appointment: any) {
    this.id = appointment.id;
    this.code = appointment.code;
    this.patientId = appointment.patientId;
    this.patientName = appointment.patient ? appointment.patient.fullName : '';
    this.patientPhone = appointment.patient ? appointment.patient.phone || '' : '';
    this.patientEmail = appointment.patient ? appointment.patient.email || '' : '';

    this.doctorId = appointment.dentistId;
    this.doctorName = appointment.dentist ? appointment.dentist.fullName : '';

    this.serviceId = appointment.serviceId;
    this.serviceName = appointment.service ? appointment.service.name : '';
    this.servicePrice = appointment.service ? Number(appointment.service.price || appointment.service.basePrice || 0) : 0;
    this.serviceUnit = appointment.service ? appointment.service.unit : undefined;
    this.service = appointment.service ? {
      id: appointment.service.id,
      name: appointment.service.name,
      price: Number(appointment.service.price || appointment.service.basePrice || 0),
      unit: appointment.service.unit,
    } : undefined;

    this.appointmentDate = appointment.appointmentDate;
    this.startTime = appointment.startTime;
    this.endTime = appointment.endTime;
    this.durationMinutes = appointment.durationMinutes;

    this.status = appointment.status;
    this.type = appointment.type;

    this.chiefComplaint = appointment.chiefComplaint;
    this.notes = appointment.notes;
    this.cancelReason = appointment.cancelReason;

    this.checkedInAt = appointment.checkedInAt || null;
    this.startedAt = appointment.startedAt || null;
    this.completedAt = appointment.completedAt || null;
    this.cancelledAt = appointment.cancelledAt || null;

    this.createdAt = appointment.createdAt || new Date();
    this.updatedAt = appointment.updatedAt || new Date();
    this.createdBy = appointment.createdBy || null;

    this.prescriptions = appointment.prescriptions
      ? appointment.prescriptions.map((p: any) => {
          const plain = typeof p.get === 'function' ? p.get({ plain: true }) : p;
          return {
            ...plain,
            patient: {
              id: this.patientId,
              fullName: this.patientName,
              phone: this.patientPhone,
            },
          };
        })
      : undefined;
  }

  static toList(appointments: any[]): AppointmentResponseDto[] {
    return appointments.map((appt) => new AppointmentResponseDto(appt));
  }
}
