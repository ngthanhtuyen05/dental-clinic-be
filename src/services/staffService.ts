import { staffRepository } from '../repositories/staffRepository.js';
import { hashPassword } from '../utils/password.js';
import { User } from '../models/index.js';
import AppError from '../utils/AppError.js';
import HttpStatus from '../constants/httpStatus.js';

interface GetStaffParams {
  page: number;
  limit: number;
  keyword?: string;
  role?: string;
  status?: string;
  specialtyId?: number;
  specialtySlug?: string;
}

export const getAllStaff = async (params: GetStaffParams) => {
  const { page, limit, keyword, role, status, specialtyId, specialtySlug } = params;
  const offset = (page - 1) * limit;
  const where = staffRepository.buildSearchWhere(keyword, role, status, specialtyId, specialtySlug);

  const [{ rows, count }, roleCounts] = await Promise.all([
    staffRepository.findAndCount({ where, limit, offset }),
    staffRepository.countByRole(),
  ]);

  return {
    staff: rows,
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit),
    roleCounts,
  };
};

export const getStaffById = async (id: number) => {
  const staff = await staffRepository.findById(id);
  if (!staff) throw new Error('Không tìm thấy nhân viên');
  return staff;
};

export const createStaff = async (data: {
  fullName: string;
  email: string;
  phone?: string | null;
  role: string;
  specialty?: string | null;
  specialtyId?: number | null;
  hireDate: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  notes?: string | null;
  staffStatus?: string;
  academicTitle?: string | null;
  licenseNumber?: string | null;
  licenseDate?: string | null;
  experienceYears?: number | null;
  avatar?: string | null;
  badge?: string | null;
  bio?: string | null;
  quote?: string | null;
  education?: any[] | null;
  certificates?: any[] | null;
  achievements?: any[] | null;
  workingSchedule?: string | null;
  slotDuration?: number | null;
  subSpecialties?: string[] | null;
}) => {
  // Kiểm tra Email trùng
  if (data.email) {
    const existingEmail = await User.findOne({ where: { email: data.email } });
    if (existingEmail) {
      throw new AppError('Email này đã được sử dụng bởi nhân viên khác', HttpStatus.CONFLICT);
    }
  }

  // Kiểm tra SĐT trùng
  if (data.phone) {
    const existing = await User.findOne({ where: { phone: data.phone } });
    if (existing) {
      throw new AppError('Số điện thoại đã được sử dụng bởi nhân viên khác', HttpStatus.CONFLICT);
    }
  }

  // Hash mật khẩu mặc định (NV sẽ đổi khi đăng nhập lần đầu)
  const defaultPassword = await hashPassword('Dental@123');
  const staffCode = await staffRepository.getNextCode();

  const userData = {
    fullName: data.fullName,
    email: data.email,
    phone: data.phone || null,
    role: data.role,
    password: defaultPassword,
  };

  const profileData = {
    staffCode,
    specialty: data.specialty || null,
    specialtyId: data.specialtyId || null,
    hireDate: data.hireDate,
    gender: data.gender || null,
    dateOfBirth: data.dateOfBirth || null,
    address: data.address || null,
    notes: data.notes || null,
    staffStatus: data.staffStatus || 'active',
    academicTitle: data.academicTitle || null,
    licenseNumber: data.licenseNumber || null,
    licenseDate: data.licenseDate || null,
    experienceYears: data.experienceYears ?? 0,
    avatar: data.avatar || null,
    badge: data.badge || null,
    bio: data.bio || null,
    quote: data.quote || null,
    education: data.education || [],
    certificates: data.certificates || [],
    achievements: data.achievements || [],
    workingSchedule: data.workingSchedule || null,
    slotDuration: data.slotDuration || 30,
    subSpecialties: data.subSpecialties || [],
  };

  return staffRepository.createWithProfile(userData, profileData);
};

export const updateStaff = async (id: number, data: any) => {
  // Kiểm tra Email trùng (trừ chính user đang update)
  if (data.email) {
    const existingEmail = await User.findOne({ where: { email: data.email } });
    if (existingEmail && existingEmail.id !== id) {
      throw new AppError('Email này đã được sử dụng bởi nhân viên khác', HttpStatus.CONFLICT);
    }
  }

  // Kiểm tra SĐT trùng (trừ chính user đang update)
  if (data.phone) {
    const existing = await User.findOne({ where: { phone: data.phone } });
    if (existing && existing.id !== id) {
      throw new AppError('Số điện thoại đã được sử dụng bởi nhân viên khác', HttpStatus.CONFLICT);
    }
  }

  // Separate user fields and profile fields
  const userFields: Record<string, any> = {};
  const profileFields: Record<string, any> = {};

  if (data.fullName !== undefined) userFields.fullName = data.fullName;
  if (data.email !== undefined) userFields.email = data.email;
  if (data.phone !== undefined) userFields.phone = data.phone;
  if (data.role !== undefined) userFields.role = data.role;

  if (data.specialty !== undefined) profileFields.specialty = data.specialty;
  if (data.specialtyId !== undefined) profileFields.specialtyId = data.specialtyId;
  if (data.hireDate !== undefined) profileFields.hireDate = data.hireDate;
  if (data.gender !== undefined) profileFields.gender = data.gender;
  if (data.dateOfBirth !== undefined) profileFields.dateOfBirth = data.dateOfBirth;
  if (data.address !== undefined) profileFields.address = data.address;
  if (data.notes !== undefined) profileFields.notes = data.notes;
  if (data.staffStatus !== undefined) profileFields.staffStatus = data.staffStatus;
  if (data.academicTitle !== undefined) profileFields.academicTitle = data.academicTitle;
  if (data.licenseNumber !== undefined) profileFields.licenseNumber = data.licenseNumber;
  if (data.licenseDate !== undefined) profileFields.licenseDate = data.licenseDate;
  if (data.experienceYears !== undefined) profileFields.experienceYears = data.experienceYears;
  if (data.avatar !== undefined) profileFields.avatar = data.avatar;
  if (data.badge !== undefined) profileFields.badge = data.badge;
  if (data.bio !== undefined) profileFields.bio = data.bio;
  if (data.quote !== undefined) profileFields.quote = data.quote;
  if (data.education !== undefined) profileFields.education = data.education;
  if (data.certificates !== undefined) profileFields.certificates = data.certificates;
  if (data.achievements !== undefined) profileFields.achievements = data.achievements;
  if (data.workingSchedule !== undefined) profileFields.workingSchedule = data.workingSchedule;
  if (data.slotDuration !== undefined) profileFields.slotDuration = data.slotDuration;
  if (data.subSpecialties !== undefined) profileFields.subSpecialties = data.subSpecialties;

  const result = await staffRepository.updateWithProfile(id, userFields, profileFields);
  if (!result) throw new Error('Không tìm thấy nhân viên');
  return result;
};

export const getStaffStats = async () => {
  return staffRepository.countByRole();
};

export const resetPassword = async (id: number) => {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('Không tìm thấy nhân viên', HttpStatus.NOT_FOUND);

  const defaultPassword = await hashPassword('Dental@123');
  await user.update({ password: defaultPassword });
  return true;
};

export const toggleStatus = async (id: number) => {
  const staff = await staffRepository.findById(id);
  if (!staff) throw new AppError('Không tìm thấy nhân viên', HttpStatus.NOT_FOUND);

  const currentStatus = (staff as any).staffProfile?.staffStatus || 'active';
  const newStatus = currentStatus === 'active' ? 'resigned' : 'active';

  const result = await staffRepository.updateWithProfile(id, {}, { staffStatus: newStatus });
  if (!result) throw new AppError('Cập nhật thất bại', HttpStatus.INTERNAL_SERVER_ERROR);
  return result;
};
