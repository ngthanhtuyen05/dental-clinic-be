import { appointmentRepository } from '../repositories/appointmentRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { serviceRepository } from '../repositories/serviceRepository.js';
import { AppointmentStatus, AppointmentType, UserRole, PatientStatus } from '../constants/enums.js';
import type {
  CreateAppointmentRequestDto,
  UpdateAppointmentRequestDto,
  AppointmentQueryParamsDto,
  PaginatedAppointmentsDto,
} from '../dtos/appointmentDto.js';
import AppError from '../utils/AppError.js';
import sequelize from '../config/db.js';
import { Op } from 'sequelize';
import User from '../models/userModel.js';
import { hashPassword } from '../utils/password.js';

// Helper: Cộng giờ
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

async function generateAppointmentCode(dateStr: string): Promise<string> {
  const cleanDate = dateStr.replace(/-/g, '');
  const prefix = `LH${cleanDate}-`;
  const randomSeq = Math.floor(100 + Math.random() * 900);
  return `${prefix}${randomSeq}`;
}

export const getAllAppointments = async (params: AppointmentQueryParamsDto): Promise<PaginatedAppointmentsDto> => {
  const { page = 1, limit = 10, keyword, status, type, doctorId, patientId, dateFrom, dateTo, appointmentDate } = params;
  const offset = (page - 1) * limit;

  const where: any = {};

  if (status) where.status = status;
  if (type) where.type = type;
  if (doctorId) where.dentistId = doctorId;
  if (patientId) where.patientId = patientId;

  if (appointmentDate) {
    where.appointmentDate = appointmentDate;
  } else if (dateFrom || dateTo) {
    where.appointmentDate = {};
    if (dateFrom) where.appointmentDate[Op.gte] = dateFrom;
    if (dateTo) where.appointmentDate[Op.lte] = dateTo;
  }

  if (keyword) {
    const kw = `%${keyword.trim()}%`;
    where[Op.or] = [
      { code: { [Op.like]: kw } },
      { chiefComplaint: { [Op.like]: kw } },
      { notes: { [Op.like]: kw } },
    ];
  }

  const { rows, count } = await appointmentRepository.findAndCount({
    where,
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
  const { 
    patientId: inputPatientId, 
    dentistId: inputDentistId, 
    serviceId: inputServiceId, 
    appointmentDate, 
    startTime, 
    type = AppointmentType.REGULAR, 
    fullName,
    phone,
    email,
    chiefComplaint, 
    notes 
  } = appointmentData;

  // 1. Tìm hoặc tạo Bệnh nhân (Patient)
  let patientId = inputPatientId;
  let patient: any = null;

  if (patientId) {
    patient = await userRepository.findById(patientId);
  } else if (phone || email) {
    if (phone) {
      patient = await User.findOne({ where: { phone } });
    }
    if (!patient && email) {
      patient = await User.findOne({ where: { email } });
    }
  }

  // Nếu vẫn chưa có bệnh nhân (khách vãng lai lần đầu đặt lịch) -> Tự động tạo hồ sơ bệnh nhân
  if (!patient) {
    const defaultPassword = await hashPassword('Dental@123');
    const newPhone = phone || `09${Math.floor(10000000 + Math.random() * 90000000)}`;
    const newEmail = email || `khach_${Date.now()}@dental.com`;
    const newName = fullName || 'Khách Đặt Hẹn';

    patient = await User.create({
      fullName: newName,
      phone: newPhone,
      email: newEmail,
      role: UserRole.PATIENT,
      password: defaultPassword,
    });

    try {
      const PatientProfileModel = (await import('../models/patientProfileModel.js')).default;
      await PatientProfileModel.create({
        userId: patient.id,
        medicalHistory: null,
        notes: null,
      } as any);
    } catch (e) {
      console.warn("Could not create patient profile automatically:", e);
    }
  }

  patientId = patient.id;

  // 2. Xử lý Bác sĩ (Dentist)
  let dentistId: number | null = null;
  const numDentistId = Number(inputDentistId);

  if (!isNaN(numDentistId) && numDentistId > 0) {
    const dentist = await userRepository.findById(numDentistId);
    if (dentist) {
      dentistId = dentist.id;
    }
  }

  // Nếu chọn "Bác sĩ bất kỳ" hoặc ID không hợp lệ -> Tự động chọn Bác sĩ nha khoa sẵn có từ DB
  if (!dentistId) {
    const availableDentist = await User.findOne({ where: { role: UserRole.DENTIST } });
    if (availableDentist) {
      dentistId = availableDentist.id;
    } else {
      // Fallback nếu chưa có tài khoản role DENTIST
      const anyStaff = await User.findOne({ where: { role: [UserRole.ADMIN, UserRole.STAFF] } });
      dentistId = anyStaff ? anyStaff.id : (patientId ?? null);
    }
  }

  // 3. Xử lý Dịch vụ (Service)
  const serviceId = Number(inputServiceId);
  let service = await serviceRepository.findById(serviceId);
  
  if (!service) {
    const allServices = await serviceRepository.findAndCount({ limit: 1, offset: 0 });
    if (allServices && allServices.rows && allServices.rows.length > 0) {
      service = allServices.rows[0];
    } else {
      throw new AppError('Dịch vụ không tồn tại.', 400);
    }
  }

  const durationMinutes = service.durationMinutes || 30;
  const endTime = calculateEndTime(startTime, durationMinutes);

  // 4. Tự sinh mã code
  const code = await generateAppointmentCode(appointmentDate);

  // 5. Kiểm tra trùng lịch trước khi tạo
  if (dentistId) {
    const conflicts = await appointmentRepository.findConflicting(dentistId, appointmentDate, startTime, endTime);
    if (conflicts.length > 0) {
      throw new AppError('Bác sĩ đã có lịch hẹn khác trong khung giờ này. Vui lòng chọn khung giờ khác.', 400);
    }
  }

  // 6. Tạo lịch hẹn vào Database
  const appt = await appointmentRepository.create({
    code,
    patientId,
    dentistId,
    serviceId: service.id,
    appointmentDate: new Date(appointmentDate),
    startTime,
    endTime,
    durationMinutes,
    status: AppointmentStatus.SCHEDULED,
    type,
    chiefComplaint: chiefComplaint || null,
    notes: notes || null,
    createdBy: currentUserId ?? null,
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

  if (data.patientId && Number(data.patientId) !== appt.patientId) {
    const numPatientId = Number(data.patientId);
    const patient = await userRepository.findById(numPatientId);
    if (!patient) throw new AppError('Bệnh nhân không tồn tại.', 400);
    updateFields.patientId = numPatientId;
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

  if (data.serviceId && Number(data.serviceId) !== appt.serviceId) {
    const numServiceId = Number(data.serviceId);
    const service = await serviceRepository.findById(numServiceId);
    if (!service) throw new AppError('Dịch vụ không tồn tại.', 400);
    updateFields.serviceId = numServiceId;
    updateFields.durationMinutes = service.durationMinutes;
    serviceId = numServiceId;
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

  if (data.dentistId && Number(data.dentistId) !== appt.dentistId) {
    const numDentistId = Number(data.dentistId);
    const dentist = await userRepository.findById(numDentistId);
    if (!dentist) throw new AppError('Bác sĩ không tồn tại.', 400);
    dentistId = numDentistId;
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

export const getTodayStats = async (doctorId?: number) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Đếm theo từng status
  const statuses = Object.values(AppointmentStatus);
  const stats: Record<string, number> = {};

  for (const s of statuses) {
    const where: any = { appointmentDate: today, status: s };
    if (doctorId) where.dentistId = doctorId;

    stats[s] = await appointmentRepository.countByStatus(where);
  }

  const totalWhere: any = { appointmentDate: today };
  if (doctorId) totalWhere.dentistId = doctorId;

  const total = await appointmentRepository.countByStatus(totalWhere);

  return {
    date: today,
    stats,
    total,
  };
};

export const getAvailableSlots = async (
  dentistId?: number,
  date?: string,
  durationMinutes: number = 30
) => {
  if (!date) {
    throw new AppError('Thiếu thông tin ngày khám (date).', 400);
  }

  // Khung giờ làm việc mặc định từ 08:00 đến 17:30
  // Ca sáng: 08:00 đến 12:00
  // Nghỉ trưa: 12:00 đến 13:30
  // Ca chiều: 13:30 đến 17:30
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

  // Helper check if time slot is in the past for today (UTC+7 / Vietnam time)
  const now = new Date();
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(now);
  const currentHourMinute = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);

  const isToday = date === todayStr;

  if (dentistId) {
    const dentist = await userRepository.findById(dentistId);
    if (!dentist) {
      throw new AppError('Bác sĩ không tồn tại.', 400);
    }

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
      const isPast = isToday && slot.start <= currentHourMinute;
      const slotEndTime = calculateEndTime(slot.start, durationMinutes);
      const isMorning = slot.start < '12:00';
      const maxShiftEnd = isMorning ? '12:00' : '17:30';
      const exceedsShift = slotEndTime > maxShiftEnd;

      const isConflict = existingAppts.rows.some((appt) => {
        return slot.start < appt.endTime && slotEndTime > appt.startTime;
      });

      return {
        startTime: slot.start,
        endTime: slot.end,
        available: !isPast && !isConflict && !exceedsShift,
        isPast,
        isBooked: isConflict,
      };
    });

    return slots;
  } else {
    // Khách chọn "Bác sĩ bất kỳ / tự động": kiểm tra xem có bác sĩ nào rảnh không
    const dentists = await User.findAll({
      where: { role: UserRole.DENTIST },
      attributes: ['id', 'fullName'],
    });

    if (dentists.length === 0) {
      return allSlots.map((slot) => {
        const isPast = isToday && slot.start <= currentHourMinute;
        return {
          startTime: slot.start,
          endTime: slot.end,
          available: !isPast,
          isPast,
          isBooked: false,
        };
      });
    }

    const dentistIds = dentists.map((d) => d.id);
    const existingAppts = await appointmentRepository.findAndCount({
      where: {
        dentistId: { [Op.in]: dentistIds },
        appointmentDate: date,
        status: {
          [Op.notIn]: ['cancelled', 'no_show'],
        },
      },
      limit: 500,
      offset: 0,
    });

    const slots = allSlots.map((slot) => {
      const isPast = isToday && slot.start <= currentHourMinute;
      const slotEndTime = calculateEndTime(slot.start, durationMinutes);
      const isMorning = slot.start < '12:00';
      const maxShiftEnd = isMorning ? '12:00' : '17:30';
      const exceedsShift = slotEndTime > maxShiftEnd;

      // Tìm xem có bác sĩ nào còn trống trong khung giờ này không
      const freeDentist = dentistIds.find((dId) => {
        const hasConflict = existingAppts.rows.some((appt) => {
          return appt.dentistId === dId && slot.start < appt.endTime && slotEndTime > appt.startTime;
        });
        return !hasConflict;
      });

      const isAllBooked = !freeDentist;

      return {
        startTime: slot.start,
        endTime: slot.end,
        available: !isPast && !isAllBooked && !exceedsShift,
        isPast,
        isBooked: isAllBooked,
      };
    });

    return slots;
  }
};

export const getMyAppointments = async (
  userId: number,
  params: { page: number; limit: number; status?: AppointmentStatus; keyword?: string }
) => {
  const { page, limit, status, keyword } = params;
  const offset = (page - 1) * limit;

  const where: any = { patientId: userId };
  if (status) where.status = status;
  if (keyword) {
    const kw = `%${keyword.trim()}%`;
    where[Op.or] = [
      { code: { [Op.like]: kw } },
      { chiefComplaint: { [Op.like]: kw } },
      { notes: { [Op.like]: kw } },
    ];
  }

  const { rows, count } = await appointmentRepository.findAndCount({
    where,
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
