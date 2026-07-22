import { appointmentRepository } from '../repositories/appointmentRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { serviceRepository } from '../repositories/serviceRepository.js';
import { AppointmentStatus, AppointmentType } from '../constants/enums.js';
import type {
  CreateAppointmentRequestDto,
  UpdateAppointmentRequestDto,
  AppointmentQueryParamsDto,
  PaginatedAppointmentsDto,
} from '../dtos/appointmentDto.js';
import AppError from '../utils/AppError.js';
import sequelize from '../config/db.js';
import { Op } from 'sequelize';

// Helper: Cộng giờ
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

// Helper: Sinh mã code tự động
async function generateAppointmentCode(dateStr: string): Promise<string> {
  const lastNum = await appointmentRepository.getLastCodeNumberForDate(dateStr);
  const nextNum = lastNum + 1;
  const dateFormatted = dateStr.replace(/-/g, ''); // "2026-07-19" -> "20260719"
  return `APT-${dateFormatted}-${String(nextNum).padStart(3, '0')}`;
}

export const getAllAppointments = async (query: AppointmentQueryParamsDto): Promise<PaginatedAppointmentsDto> => {
  const page = Math.max(query.page || 1, 1);
  const limit = Math.min(Math.max(query.limit || 10, 1), 100);
  const offset = (page - 1) * limit;

  const { where, patientWhere } = appointmentRepository.buildWhereOptions(query);

  const { rows, count } = await appointmentRepository.findAndCount({
    where,
    patientWhere,
    limit,
    offset,
  });

  return {
    appointments: rows,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
};

export const getAppointmentById = async (id: number) => {
  const appointment = await appointmentRepository.findById(id);
  if (!appointment) {
    throw new AppError('Không tìm thấy lịch hẹn.', 404);
  }
  return appointment;
};

export const createNewAppointment = async (
  appointmentData: CreateAppointmentRequestDto,
  currentUserId?: number
) => {
  const { patientId, dentistId, serviceId, appointmentDate, startTime, type, chiefComplaint, notes } = appointmentData;

  // 1. Kiểm tra sự tồn tại của Patient, Dentist và Service
  const patient = await userRepository.findById(patientId);
  if (!patient) {
    throw new AppError('Bệnh nhân không tồn tại.', 400);
  }

  const dentist = await userRepository.findById(dentistId);
  if (!dentist) {
    throw new AppError('Bác sĩ không tồn tại.', 400);
  }

  const service = await serviceRepository.findById(serviceId);
  if (!service) {
    throw new AppError('Dịch vụ không tồn tại.', 400);
  }

  const durationMinutes = service.durationMinutes || 30;
  const endTime = calculateEndTime(startTime, durationMinutes);

  // 2. Kiểm tra trùng lịch bác sĩ
  const conflicts = await appointmentRepository.findConflicting(dentistId, appointmentDate, startTime, endTime);
  if (conflicts.length > 0) {
    throw new AppError('Bác sĩ đã có lịch hẹn khác trùng khớp với thời gian này.', 400);
  }

  // 3. Tự sinh mã code
  const code = await generateAppointmentCode(appointmentDate);

  // 4. Tạo lịch hẹn
  const appt = await appointmentRepository.create({
    code,
    patientId,
    dentistId,
    serviceId,
    appointmentDate: new Date(appointmentDate),
    startTime,
    endTime,
    durationMinutes,
    status: AppointmentStatus.SCHEDULED,
    type,
    chiefComplaint: chiefComplaint || null,
    notes: notes || null,
    createdBy: currentUserId || null,
    cancelReason: null,
    checkedInAt: null,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
  } as any);

  // Re-fetch đầy đủ liên kết để trả về
  return await appointmentRepository.findById(appt.id);
};

export const updateAppointment = async (id: number, data: UpdateAppointmentRequestDto) => {
  const appt = await appointmentRepository.findById(id);
  if (!appt) {
    throw new AppError('Không tìm thấy lịch hẹn.', 404);
  }

  // Tránh update lịch đã hoàn thành hoặc đã hủy
  if (appt.status === AppointmentStatus.COMPLETED || appt.status === AppointmentStatus.CANCELLED) {
    throw new AppError('Không thể sửa lịch hẹn đã hoàn thành hoặc đã hủy.', 400);
  }

  const updateFields: any = {};

  if (data.patientId && data.patientId !== appt.patientId) {
    const patient = await userRepository.findById(data.patientId);
    if (!patient) throw new AppError('Bệnh nhân không tồn tại.', 400);
    updateFields.patientId = data.patientId;
  }

  if (data.dentistId) updateFields.dentistId = data.dentistId;
  if (data.appointmentDate) updateFields.appointmentDate = new Date(data.appointmentDate);
  if (data.startTime) updateFields.startTime = data.startTime;
  if (data.type) updateFields.type = data.type;
  if (data.chiefComplaint !== undefined) updateFields.chiefComplaint = data.chiefComplaint;
  if (data.notes !== undefined) updateFields.notes = data.notes;

  // Tính lại thời gian nếu đổi startTime hoặc serviceId
  let checkConflict = false;
  let serviceId = appt.serviceId;
  let startTime = appt.startTime;
  let dateStr = appt.appointmentDate.toString();
  let dentistId = appt.dentistId;

  if (data.serviceId && data.serviceId !== appt.serviceId) {
    const service = await serviceRepository.findById(data.serviceId);
    if (!service) throw new AppError('Dịch vụ không tồn tại.', 400);
    updateFields.serviceId = data.serviceId;
    updateFields.durationMinutes = service.durationMinutes;
    serviceId = data.serviceId;
    checkConflict = true;
  }

  if (data.startTime && data.startTime !== appt.startTime) {
    startTime = data.startTime;
    checkConflict = true;
  }

  if (data.appointmentDate) {
    dateStr = data.appointmentDate;
    checkConflict = true;
  }

  if (data.dentistId && data.dentistId !== appt.dentistId) {
    const dentist = await userRepository.findById(data.dentistId);
    if (!dentist) throw new AppError('Bác sĩ không tồn tại.', 400);
    dentistId = data.dentistId;
    checkConflict = true;
  }

  if (checkConflict) {
    const duration = updateFields.durationMinutes || appt.durationMinutes;
    const endTime = calculateEndTime(startTime, duration);
    updateFields.endTime = endTime;

    // Check trùng lịch ngoại trừ chính nó
    const conflicts = await appointmentRepository.findConflicting(dentistId, dateStr, startTime, endTime, id);
    if (conflicts.length > 0) {
      throw new AppError('Bác sĩ đã có lịch hẹn khác trùng khớp với thời gian này.', 400);
    }
  }

  await appointmentRepository.update(appt, updateFields);

  return await appointmentRepository.findById(id);
};

export const updateAppointmentStatus = async (id: number, status: AppointmentStatus, cancelReason?: string) => {
  const appt = await appointmentRepository.findById(id);
  if (!appt) {
    throw new AppError('Không tìm thấy lịch hẹn.', 404);
  }

  const currentStatus = appt.status;
  if (currentStatus === status) {
    return appt; // Không thay đổi
  }

  // Validate state machine chuyển đổi trạng thái
  // scheduled -> confirmed / cancelled
  // confirmed -> checked_in / no_show / cancelled
  // checked_in -> in_progress
  // in_progress -> completed
  const allowedTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
    [AppointmentStatus.SCHEDULED]: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
    [AppointmentStatus.CONFIRMED]: [AppointmentStatus.CHECKED_IN, AppointmentStatus.NO_SHOW, AppointmentStatus.CANCELLED],
    [AppointmentStatus.CHECKED_IN]: [AppointmentStatus.IN_PROGRESS, AppointmentStatus.CANCELLED],
    [AppointmentStatus.IN_PROGRESS]: [AppointmentStatus.COMPLETED],
    [AppointmentStatus.COMPLETED]: [],
    [AppointmentStatus.CANCELLED]: [],
    [AppointmentStatus.NO_SHOW]: [],
  };

  const allowed = allowedTransitions[currentStatus as AppointmentStatus];
  if (!allowed || !allowed.includes(status)) {
    throw new AppError(`Không thể chuyển đổi trạng thái từ ${currentStatus} sang ${status}.`, 400);
  }

  const updateFields: any = { status };

  // Ghi nhận thời điểm đặc biệt
  const now = new Date();
  if (status === AppointmentStatus.CHECKED_IN) {
    updateFields.checkedInAt = now;
  } else if (status === AppointmentStatus.IN_PROGRESS) {
    updateFields.startedAt = now;
  } else if (status === AppointmentStatus.COMPLETED) {
    updateFields.completedAt = now;
  } else if (status === AppointmentStatus.CANCELLED) {
    updateFields.cancelledAt = now;
    updateFields.cancelReason = cancelReason || 'Không có lý do hủy cụ thể';
  }

  await appointmentRepository.update(appt, updateFields);

  return await appointmentRepository.findById(id);
};

export const getTodayStats = async () => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Đếm theo từng status
  const statuses = Object.values(AppointmentStatus);
  const stats: Record<string, number> = {};

  for (const s of statuses) {
    stats[s] = await appointmentRepository.countByStatus({
      appointmentDate: today,
      status: s,
    });
  }

  const total = await appointmentRepository.countByStatus({
    appointmentDate: today,
  });

  return {
    date: today,
    stats,
    total,
  };
};

export const getAvailableSlots = async (dentistId: number, date: string) => {
  const dentist = await userRepository.findById(dentistId);
  if (!dentist) {
    throw new AppError('Bác sĩ không tồn tại.', 400);
  }

  // Khung giờ làm việc mặc định từ 08:00 đến 17:30
  // Nghỉ trưa từ 12:00 đến 13:30
  // Mỗi slot mặc định 30 phút
  const allSlots = [
    { start: '08:00', end: '08:30' },
    { start: '08:30', end: '09:00' },
    { start: '09:00', end: '09:30' },
    { start: '09:30', end: '10:00' },
    { start: '10:00', end: '10:30' },
    { start: '10:30', end: '11:00' },
    { start: '11:00', end: '11:30' },
    { start: '11:30', end: '12:00' },
    // Trưa
    { start: '13:30', end: '14:00' },
    { start: '14:00', end: '14:30' },
    { start: '14:30', end: '15:00' },
    { start: '15:00', end: '15:30' },
    { start: '15:30', end: '16:00' },
    { start: '16:00', end: '16:30' },
    { start: '16:30', end: '17:00' },
    { start: '17:00', end: '17:30' },
  ];

  // Lấy các lịch hẹn hiện có trong ngày của bác sĩ
  const existingAppts = await appointmentRepository.findAndCount({
    where: {
      dentistId,
      appointmentDate: date,
      status: {
        [Op.notIn]: ['cancelled', 'no_show'],
      },
    },
    limit: 100,
    offset: 0,
  });

  const slots = allSlots.map((slot) => {
    // Kiểm tra xem slot này có bị xung đột với lịch hẹn nào không
    const isConflict = existingAppts.rows.some((appt) => {
      return (slot.start < appt.endTime && slot.end > appt.startTime);
    });

    return {
      startTime: slot.start,
      endTime: slot.end,
      available: !isConflict,
    };
  });

  return slots;
};
