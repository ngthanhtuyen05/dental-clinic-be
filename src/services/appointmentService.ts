import crypto from 'crypto';
import { appointmentRepository } from '../repositories/appointmentRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { serviceRepository } from '../repositories/serviceRepository.js';
import { Prescription, PatientProfile, TreatmentHistory } from '../models/index.js';
import { AppointmentStatus, AppointmentType, UserRole, PatientStatus, PrescriptionStatus } from '../constants/enums.js';
import type {
  CreateAppointmentRequestDto,
  UpdateAppointmentRequestDto,
  AppointmentQueryParamsDto,
  PaginatedAppointmentsDto,
} from '../dtos/appointmentDto.js';
import AppError from '../utils/AppError.js';
import HttpStatus from '../constants/httpStatus.js';
import sequelize from '../config/db.js';
import { Op } from 'sequelize';
import User from '../models/userModel.js';
import { Notification } from '../models/index.js';
import { emitToStaff } from './socketService.js';
import { hashPassword } from '../utils/password.js';
import { getClinicToday, getClinicTimeHHmm } from '../utils/datetime.js';

// Helper: Cộng giờ
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

function generateAppointmentCode(dateStr: string): string {
  const cleanDate = dateStr.replace(/-/g, '');
  const prefix = `LH${cleanDate}-`;
  const randomSeq = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}${randomSeq}`;
}

/**
 * Khóa "lịch làm việc" của một bác sĩ trong phạm vi transaction hiện tại.
 *
 * Không có ràng buộc UNIQUE nào diễn tả được "hai khoảng thời gian không được chồng nhau",
 * nên ta serialize mọi thao tác đặt/dời lịch của CÙNG một bác sĩ bằng cách khóa dòng Users
 * của bác sĩ đó. Giao dịch thứ hai sẽ nằm chờ ở đây cho tới khi giao dịch thứ nhất commit,
 * rồi mới chạy kiểm tra trùng lịch — lúc đó đã nhìn thấy lịch hẹn vừa được tạo.
 */
const lockDentistSchedule = async (dentistId: number, transaction: any) => {
  await User.findByPk(dentistId, { transaction, lock: transaction.LOCK.UPDATE });
};

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
    // Trước đây patientId không tồn tại thì `patient` vẫn null và rơi xuống nhánh khách vãng
    // lai bên dưới => lặng lẽ tạo ra một tài khoản "Khách Đặt Hẹn" mới thay vì báo lỗi.
    if (!patient) {
      throw new AppError('Bệnh nhân được chọn không tồn tại.', HttpStatus.BAD_REQUEST);
    }
  } else if (phone || email) {
    if (phone) {
      patient = await User.findOne({ where: { phone } });
    }
    if (!patient && email) {
      patient = await User.findOne({ where: { email } });
    }
  }

  // Người đi khám bắt buộc phải có hồ sơ bệnh án — xét theo HỒ SƠ chứ không theo vai trò tài
  // khoản: nhân viên phòng khám vẫn có thể tự đến khám (DB hiện có 1 bác sĩ mang hồ sơ bệnh
  // nhân). Ngược lại, trước đây điều kiện `role === PATIENT` khiến tài khoản nhân viên không
  // có hồ sơ nào vẫn đặt được lịch và lọt qua cả kiểm tra ngừng hoạt động.
  if (patient) {
    const existingProfile = await PatientProfile.findOne({ where: { userId: patient.id } });
    if (!existingProfile) {
      throw new AppError('Vui lòng hoàn tất hồ sơ bệnh nhân trước khi đặt lịch hẹn.', 400);
    }
    // Hồ sơ đã ngừng hoạt động thì không tiếp nhận lịch hẹn mới — nếu không, thao tác
    // "Ngừng hoạt động" ở màn hình bệnh nhân sẽ không có tác dụng nghiệp vụ nào.
    if (existingProfile.status === PatientStatus.INACTIVE) {
      throw new AppError(
        'Hồ sơ bệnh nhân này đang ở trạng thái ngừng hoạt động, không thể đặt lịch hẹn mới. Vui lòng liên hệ phòng khám để kích hoạt lại.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 2. Xử lý Bác sĩ (Dentist)
  let dentistId: number | null = null;
  const numDentistId = Number(inputDentistId);

  if (!isNaN(numDentistId) && numDentistId > 0) {
    const dentist = await userRepository.findById(numDentistId);
    // Chỉ tài khoản có vai trò bác sĩ mới được phân công khám. Trước đây chỉ kiểm tra tồn
    // tại, nên truyền id của một bệnh nhân/lễ tân vào dentistId vẫn tạo được lịch hẹn với
    // "bác sĩ phụ trách" là người đó.
    if (!dentist) {
      throw new AppError('Bác sĩ được chọn không tồn tại.', HttpStatus.BAD_REQUEST);
    }
    if (dentist.role !== UserRole.DENTIST) {
      throw new AppError('Tài khoản được chọn không phải bác sĩ nha khoa.', HttpStatus.BAD_REQUEST);
    }
    dentistId = dentist.id;
  }

  // Nếu chọn "Bác sĩ bất kỳ" hoặc ID không hợp lệ -> Tự động chọn Bác sĩ nha khoa sẵn có từ DB
  if (!dentistId) {
    const availableDentist = await User.findOne({ where: { role: UserRole.DENTIST } });
    if (availableDentist) {
      dentistId = availableDentist.id;
    } else {
      throw new AppError('Hiện chưa có bác sĩ nha khoa khả dụng để tiếp nhận lịch hẹn. Vui lòng liên hệ phòng khám.', HttpStatus.BAD_REQUEST);
    }
  }

  // 3. Xử lý Dịch vụ (Service)
  const serviceId = Number(inputServiceId);
  const service = await serviceRepository.findById(serviceId);
  if (!service) {
    throw new AppError('Dịch vụ nha khoa được chọn không tồn tại trong hệ thống.', HttpStatus.BAD_REQUEST);
  }

  const durationMinutes = service.durationMinutes || 30;
  const endTime = calculateEndTime(startTime, durationMinutes);

  // 4. Tự sinh mã code
  const code = generateAppointmentCode(appointmentDate);

  // 5. Tạo lịch hẹn trong một Transaction nguyên tử: khóa lịch bác sĩ -> kiểm tra trùng ->
  // ghi. Trước đây bước kiểm tra trùng nằm NGOÀI transaction nên hai yêu cầu đặt cùng khung
  // giờ gửi lên cùng lúc đều thấy trống và đều tạo được lịch (double-booking).
  const createdAppt = await sequelize.transaction(async (t) => {
    await lockDentistSchedule(dentistId!, t);

    const conflicts = await appointmentRepository.findConflicting(
      dentistId!, appointmentDate, startTime, endTime, undefined, t,
    );
    if (conflicts.length > 0) {
      throw new AppError('Bác sĩ đã có lịch hẹn khác trong khung giờ này. Vui lòng chọn khung giờ khác.', HttpStatus.BAD_REQUEST);
    }

    let finalPatientId = patientId;

    // Nếu vẫn chưa có bệnh nhân (khách vãng lai lần đầu đặt lịch) -> Tự động tạo tài khoản và hồ sơ
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
      }, { transaction: t });

      await PatientProfile.create({
        userId: patient.id,
        status: PatientStatus.ACTIVE,
      } as any, { transaction: t });

      finalPatientId = patient.id;
    }

    const appt = await appointmentRepository.create({
      code,
      patientId: finalPatientId!,
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
    } as any, { transaction: t });

    return appt;
  });

  // Re-fetch đầy đủ liên kết để trả về
  const fullAppt = await appointmentRepository.findById(createdAppt.id);

  // Tạo bản ghi thông báo và phát sự kiện Socket.IO thời gian thực tới CMS
  try {
    const patientObj = (fullAppt as any)?.patient;
    const dentistObj = (fullAppt as any)?.dentist;
    const serviceObj = (fullAppt as any)?.service || service;

    const patientDisplayName = patientObj?.fullName || fullName || patient?.fullName || 'Bệnh nhân';
    const patientPhone = patientObj?.phone || phone || patient?.phone || '';
    const serviceTitle = serviceObj?.name || 'Dịch vụ nha khoa';
    const doctorTitle = dentistObj?.fullName ? `Bác sĩ ${dentistObj.fullName}` : 'Bác sĩ phụ trách';

    const notifTitle = `Lịch hẹn mới: ${patientDisplayName}`;
    const notifDesc = `${patientDisplayName}${patientPhone ? ` (${patientPhone})` : ''} vừa đặt lịch hẹn ${serviceTitle} vào lúc ${startTime} ngày ${appointmentDate} với ${doctorTitle}.`;

    const notificationRecord = await Notification.create({
      userId: null,
      type: 'appointment',
      title: notifTitle,
      description: notifDesc,
      targetUrl: `/appointments?code=${code}`,
      data: JSON.stringify({
        appointmentId: createdAppt.id,
        appointmentCode: code,
        patientName: patientDisplayName,
        patientPhone,
        serviceName: serviceTitle,
        doctorName: doctorTitle,
        appointmentDate,
        startTime,
        endTime,
      }),
      isRead: false,
    });

    emitToStaff('new_appointment', {
      notification: notificationRecord,
      appointment: fullAppt,
      patientName: patientDisplayName,
      patientPhone,
      serviceName: serviceTitle,
      doctorName: doctorTitle,
      appointmentDate,
      startTime,
      code,
    });
  } catch (notifError) {
    console.error('[Notification] Error creating or broadcasting notification:', notifError);
  }

  return fullAppt;
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
    const newPatientProfile = await PatientProfile.findOne({ where: { userId: numPatientId } });
    if (!newPatientProfile) {
      throw new AppError('Tài khoản được chọn chưa có hồ sơ bệnh án, không thể gán làm bệnh nhân của lịch hẹn.', HttpStatus.BAD_REQUEST);
    }
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
    if (dentist.role !== UserRole.DENTIST) {
      throw new AppError('Tài khoản được chọn không phải bác sĩ nha khoa.', HttpStatus.BAD_REQUEST);
    }
    dentistId = numDentistId;
    checkConflict = true;
  }

  // Dời lịch cũng phải khóa + kiểm tra + ghi trong cùng một transaction, cùng lý do như khi tạo.
  await sequelize.transaction(async (t) => {
    if (checkConflict) {
      await lockDentistSchedule(dentistId, t);

      const duration = updateFields.durationMinutes || appt.durationMinutes;
      const endTime = calculateEndTime(startTime, duration);
      updateFields.endTime = endTime;

      // Check trùng lịch ngoại trừ chính nó
      const conflicts = await appointmentRepository.findConflicting(dentistId, dateStr, startTime, endTime, id, t);
      if (conflicts.length > 0) {
        throw new AppError('Bác sĩ đã có lịch hẹn khác trùng khớp với thời gian này.', 400);
      }
    }

    await appointmentRepository.update(appt, updateFields, { transaction: t });
  });

  return await appointmentRepository.findById(id);
};

/**
 * Sinh bản ghi "lần khám" (TreatmentHistory) từ một lịch hẹn vừa chuyển sang COMPLETED.
 *
 * Cột TreatmentHistories.appointmentId là UNIQUE nên nếu vì lý do nào đó hàm được gọi lại
 * cho cùng lịch hẹn, ta trả về bản ghi cũ thay vì tạo trùng. Bệnh nhân không có hồ sơ bệnh
 * án (dữ liệu cũ) thì bỏ qua — không chặn việc hoàn thành lịch hẹn vì lý do này.
 */
const createVisitFromCompletedAppointment = async (appt: any, transaction: any) => {
  const profile = await PatientProfile.findOne({
    where: { userId: appt.patientId },
    transaction,
  });
  if (!profile) return null;

  let visit = await TreatmentHistory.findOne({
    where: { appointmentId: appt.id },
    transaction,
  });

  if (!visit) {
    const service = appt.service;
    const serviceName = service?.name || 'Khám nha khoa';

    visit = await TreatmentHistory.create({
      patientProfileId: profile.id,
      dentistId: appt.dentistId,
      appointmentId: appt.id,
      diagnosis: appt.chiefComplaint?.trim() || serviceName,
      treatment: serviceName,
      cost: Number(service?.price) || 0,
      treatmentDate: new Date(),
      notes: appt.notes ?? null,
    }, { transaction });
  }

  // Đơn thuốc thường được kê NGAY TRONG LÚC KHÁM (lịch hẹn còn IN_PROGRESS), tức trước khi
  // lần khám tồn tại, nên lúc tạo đơn không có treatmentHistoryId để gắn. Gắn ngược lại ở
  // đây, nếu không thì gần như mọi đơn thuốc đều mồ côi lần khám.
  await Prescription.update(
    { treatmentHistoryId: visit.id },
    { where: { appointmentId: appt.id, treatmentHistoryId: null }, transaction },
  );

  return visit;
};

export const updateAppointmentStatus = async (id: number, status: AppointmentStatus, cancelReason?: string, notes?: string) => {
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

  // Không cho hủy lịch hẹn nếu đã có đơn thuốc CONFIRMED (đã cấp phát/trừ kho) gắn với nó —
  // việc hoàn kho phải là thao tác tường minh (hủy đơn thuốc riêng, có lý do) chứ không tự
  // động ngầm theo hành động hủy lịch hẹn.
  if (status === AppointmentStatus.CANCELLED) {
    const dispensedPrescription = await Prescription.findOne({
      where: { appointmentId: id, status: PrescriptionStatus.CONFIRMED },
    });
    if (dispensedPrescription) {
      throw new AppError(
        `Lịch hẹn này đang có đơn thuốc ${dispensedPrescription.code} đã cấp phát. Vui lòng hủy đơn thuốc trước (thao tác này sẽ hoàn kho) rồi mới hủy lịch hẹn.`,
        HttpStatus.BAD_REQUEST,
      );
    }
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
    if (notes) {
      updateFields.notes = notes;
    }
  } else if (status === AppointmentStatus.CANCELLED) {
    updateFields.cancelledAt = now;
    updateFields.cancelReason = cancelReason || 'Không có lý do hủy cụ thể';
  }

  await sequelize.transaction(async (t) => {
    await appointmentRepository.update(appt, updateFields, { transaction: t });

    // Lịch hẹn khám xong = 1 lần khám trong hồ sơ bệnh nhân. Nếu không sinh ở đây thì tab
    // "Lịch sử khám" (đọc từ TreatmentHistory) sẽ luôn rỗng dù bệnh nhân đã khám nhiều lần,
    // và đơn thuốc cũng không có lần khám nào để gắn treatmentHistoryId.
    if (status === AppointmentStatus.COMPLETED) {
      await createVisitFromCompletedAppointment(appt, t);
    }
  });

  return await appointmentRepository.findById(id);
};

export const getTodayStats = async (doctorId?: number) => {
  const today = getClinicToday();
  
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
  const todayStr = getClinicToday();
  const currentHourMinute = getClinicTimeHHmm();

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
