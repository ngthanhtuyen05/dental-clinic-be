import { patientRepository } from '../repositories/patientRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { patientProfileRepository } from '../repositories/patientProfileRepository.js';
import { PatientProfile, Appointment, TreatmentHistory, Prescription, Invoice } from '../models/index.js';
import { hashPassword } from '../utils/password.js';
import sequelize from '../config/db.js';
import AppError from '../utils/AppError.js';
import HttpStatus from '../constants/httpStatus.js';
import { UserRole, PatientStatus, Gender } from '../constants/enums.js';
import type { PatientQueryDto, CreatePatientRequestDto, UpdatePatientRequestDto, PaginatedPatientsDto } from '../dtos/patientDto.js';

export const getAllPatients = async (query: PatientQueryDto): Promise<PaginatedPatientsDto> => {
  const page = Math.max(query.page || 1, 1);
  const limit = Math.min(Math.max(query.limit || 10, 1), 100);
  const offset = (page - 1) * limit;

  const searchWhere = patientRepository.buildSearchWhere(query.keyword);
  const profileWhere = patientRepository.buildStatusWhere(query.status);

  const [findResult, summary] = await Promise.all([
    patientRepository.findAndCount({
      where: searchWhere,
      profileWhere,
      limit,
      offset,
    }),
    patientRepository.getClinicMetrics(),
  ]);

  return {
    patients: findResult.rows,
    total: findResult.count,
    page,
    limit,
    totalPages: Math.ceil(findResult.count / limit),
    summary,
  };
};

export const getPatientById = async (id: number) => {
  const patient = await patientRepository.findById(id);
  if (!patient) {
    throw new AppError('Không tìm thấy bệnh nhân.', 404);
  }
  return patient;
};

export const createNewPatient = async (data: CreatePatientRequestDto) => {
  const {
    fullName, email, phone, gender, dateOfBirth,
    allergies, chronicDiseases, bloodType,
    emergencyContactName, emergencyContactPhone,
    currentMedications, isSmoking, hasBruxism, isPregnant,
    dentalHistory, chiefComplaint,
  } = data;

  // Validate required email
  if (!email || !email.trim()) {
    throw new AppError('Email là bắt buộc.', 400);
  }

  const finalEmail = email.trim();

  // Check email uniqueness
  const existingUser = await userRepository.findByEmail(finalEmail);
  if (existingUser) {
    throw new AppError('Email đã được sử dụng bởi một tài khoản khác.', 400);
  }

  // Mật khẩu mặc định = SĐT
  const hashedPassword = await hashPassword(phone || '123456');

  // Atomic transaction: tạo User + PatientProfile
  const result = await sequelize.transaction(async (t) => {
    const user = await userRepository.create({
      fullName,
      email: finalEmail,
      password: hashedPassword,
      phone,
      role: UserRole.PATIENT,
    }, t);

    await patientProfileRepository.create({
      userId: user.id,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      allergies,
      chronicDiseases,
      bloodType,
      emergencyContactName,
      emergencyContactPhone,
      currentMedications,
      isSmoking: isSmoking ?? false,
      hasBruxism: hasBruxism ?? false,
      isPregnant: isPregnant ?? false,
      dentalHistory,
      chiefComplaint,
      odontogram: (data as any).odontogram || null,
    } as any, t);

    return user;
  });

  // Re-fetch with full includes for response
  return await patientRepository.findById(result.id);
};

export const updatePatient = async (id: number, data: UpdatePatientRequestDto) => {
  const patient = await patientRepository.findById(id);
  if (!patient) {
    throw new AppError('Không tìm thấy bệnh nhân.', 404);
  }

  // Update User fields
  const { fullName, email, phone, password, ...profileData } = data;
  if (fullName || email || phone || password) {
    const userUpdateData: Partial<Pick<import('../models/userModel.js').UserModel, 'fullName' | 'email' | 'password' | 'phone'>> = {};
    if (fullName) userUpdateData.fullName = fullName;
    if (phone) userUpdateData.phone = phone;
    if (password) userUpdateData.password = await hashPassword(password);
    if (email && email !== patient.email) {
      const existing = await userRepository.findByEmail(email);
      if (existing) throw new AppError('Email đã được sử dụng.', 400);
      userUpdateData.email = email;
    }
    await userRepository.update(patient, userUpdateData);
  }

  // Update PatientProfile fields
  const profile = (patient as any).patientProfile;
  if (profile && Object.keys(profileData).length > 0) {
    await patientProfileRepository.update(profile, {
      dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : undefined,
      gender: profileData.gender,
      allergies: profileData.allergies,
      chronicDiseases: profileData.chronicDiseases,
      bloodType: profileData.bloodType,
      emergencyContactName: profileData.emergencyContactName,
      emergencyContactPhone: profileData.emergencyContactPhone,
      currentMedications: profileData.currentMedications,
      isSmoking: profileData.isSmoking,
      hasBruxism: profileData.hasBruxism,
      isPregnant: profileData.isPregnant,
      dentalHistory: profileData.dentalHistory,
      chiefComplaint: profileData.chiefComplaint,
      odontogram: profileData.odontogram,
    } as any);
  }

  return await patientRepository.findById(id);
};

export const getPatientOdontogram = async (id: number) => {
  const patient = await patientRepository.findById(id);
  if (!patient) {
    throw new AppError('Không tìm thấy bệnh nhân.', 404);
  }
  const profile = (patient as any).patientProfile;
  return profile?.odontogram || [];
};

export const updatePatientOdontogram = async (id: number, teeth: any[]) => {
  const patient = await patientRepository.findById(id);
  if (!patient) {
    throw new AppError('Không tìm thấy bệnh nhân.', 404);
  }
  const profile = (patient as any).patientProfile;
  if (!profile) {
    throw new AppError('Không tìm thấy hồ sơ bệnh án.', 404);
  }
  await patientProfileRepository.update(profile, {
    odontogram: teeth,
  } as any);
  return teeth;
};

/**
 * Xóa bệnh nhân — chỉ cho phép với hồ sơ CHƯA phát sinh dữ liệu lâm sàng.
 *
 * Xóa User sẽ CASCADE kéo theo PatientProfile -> Prescription -> PrescriptionItem và toàn bộ
 * Appointment/TreatmentHistory/Invoice của bệnh nhân. Riêng StockTransaction.prescriptionId
 * không CASCADE nên sẽ còn lại các giao dịch kho trỏ vào đơn thuốc đã biến mất: thuốc đã trừ
 * kho mà không thể truy vết hay hoàn lại. Hồ sơ bệnh án, đơn thuốc và lịch sử điều trị là dữ
 * liệu phải lưu trữ, nên khi đã có dữ liệu lâm sàng ta từ chối xóa và hướng người dùng sang
 * thao tác "ngừng hoạt động" (PatientStatus.INACTIVE).
 */
export const deletePatient = async (id: number) => {
  const patient = await patientRepository.findById(id);
  if (!patient) {
    throw new AppError('Không tìm thấy bệnh nhân.', 404);
  }

  const profile = (patient as any).patientProfile;

  const [appointmentCount, treatmentCount, prescriptionCount, invoiceCount] = await Promise.all([
    Appointment.count({ where: { patientId: patient.id } }),
    profile ? TreatmentHistory.count({ where: { patientProfileId: profile.id } }) : Promise.resolve(0),
    profile ? Prescription.count({ where: { patientProfileId: profile.id } }) : Promise.resolve(0),
    profile ? Invoice.count({ where: { patientProfileId: profile.id } }) : Promise.resolve(0),
  ]);

  const blockers: string[] = [];
  if (appointmentCount > 0) blockers.push(`${appointmentCount} lịch hẹn`);
  if (treatmentCount > 0) blockers.push(`${treatmentCount} lần khám`);
  if (prescriptionCount > 0) blockers.push(`${prescriptionCount} đơn thuốc`);
  if (invoiceCount > 0) blockers.push(`${invoiceCount} hóa đơn`);

  if (blockers.length > 0) {
    throw new AppError(
      `Không thể xóa bệnh nhân này vì đã phát sinh ${blockers.join(', ')}. ` +
      'Hồ sơ bệnh án phải được lưu trữ — vui lòng dùng chức năng "Ngừng hoạt động" thay cho xóa.',
      HttpStatus.CONFLICT,
    );
  }

  await userRepository.delete(patient);
  return true;
};

export const togglePatientStatus = async (id: number) => {
  const patient = await patientRepository.findById(id);
  if (!patient) {
    throw new AppError('Không tìm thấy bệnh nhân.', 404);
  }

  const profile = (patient as any).patientProfile;
  if (!profile) {
    throw new AppError('Không tìm thấy hồ sơ bệnh nhân.', 404);
  }

  const newStatus = profile.status === PatientStatus.ACTIVE
    ? PatientStatus.INACTIVE
    : PatientStatus.ACTIVE;

  await patientProfileRepository.update(profile, { status: newStatus } as any);

  return await patientRepository.findById(id);
};

export const importPatients = async (patients: Array<{
  fullName: string;
  phone: string;
  gender?: string;
  age?: number | string;
  dateOfBirth?: string;
  email?: string;
  allergies?: string;
}>) => {
  if (!Array.isArray(patients) || patients.length === 0) {
    throw new AppError('Danh sách bệnh nhân nhập không được để trống.', 400);
  }

  let importedCount = 0;
  let skippedCount = 0;

  await sequelize.transaction(async (t) => {
    for (const item of patients) {
      const { fullName, phone, email, gender, age, dateOfBirth, allergies } = item;
      if (!fullName || !phone) {
        skippedCount++;
        continue;
      }

      const existingUser = await userRepository.findByPhone(phone);
      if (existingUser) {
        skippedCount++;
        continue;
      }

      const generatedEmail = email || `patient_${phone}@dental.local`;
      const hashedPassword = await hashPassword(phone || '123456');

      const user = await userRepository.create({
        fullName,
        email: generatedEmail,
        password: hashedPassword,
        phone,
        role: UserRole.PATIENT,
      }, t);

      const mapGender = (g?: string): Gender => {
        if (!g) return Gender.OTHER;
        const lower = g.trim().toLowerCase();
        if (lower === 'nam' || lower === 'male') return Gender.MALE;
        if (lower === 'nữ' || lower === 'nu' || lower === 'female') return Gender.FEMALE;
        return Gender.OTHER;
      };

      // Tự động suy ra Ngày sinh (dateOfBirth) từ Tuổi (age) nếu dateOfBirth không được nhập
      let dob: Date | undefined = undefined;
      if (dateOfBirth) {
        dob = new Date(dateOfBirth);
      } else if (age) {
        const numAge = Number(age);
        if (!isNaN(numAge) && numAge > 0) {
          const birthYear = new Date().getFullYear() - numAge;
          dob = new Date(`${birthYear}-01-01`);
        }
      }

      await patientProfileRepository.create({
        userId: user.id,
        dateOfBirth: dob,
        gender: mapGender(gender),
        allergies,
        status: PatientStatus.ACTIVE,
      } as any, t);

      importedCount++;
    }
  });

  return { importedCount, skippedCount, total: patients.length };
};

export const resolvePatientProfileId = async (paramId: string | number): Promise<number> => {
  if (!paramId) {
    throw new AppError('Mã định danh bệnh nhân không hợp lệ.', HttpStatus.BAD_REQUEST);
  }

  const clean = typeof paramId === 'string' ? paramId.replace(/^BN0*/i, '') : paramId;
  const parsedId = parseInt(String(clean), 10);

  if (isNaN(parsedId) || parsedId <= 0) {
    throw new AppError('Mã bệnh nhân không hợp lệ.', HttpStatus.BAD_REQUEST);
  }

  // `:id` LUÔN là User.id — không bao giờ là PatientProfile.id. Trước đây hàm này tra cả hai
  // bằng Op.or, nên khi PatientProfile.id của bệnh nhân A trùng số với User.id của bệnh nhân B
  // thì DB trả về bản ghi nào là tùy thứ tự quét bảng => có thể gắn đơn thuốc cho sai bệnh nhân.
  const profile = await PatientProfile.findOne({ where: { userId: parsedId } });

  if (!profile) {
    throw new AppError('Không tìm thấy hồ sơ bệnh nhân cho mã bệnh nhân này.', HttpStatus.NOT_FOUND);
  }

  return profile.id;
};

