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
}

export const getAllStaff = async (params: GetStaffParams) => {
  const { page, limit, keyword, role, status } = params;
  const offset = (page - 1) * limit;
  const where = staffRepository.buildSearchWhere(keyword, role, status);

  const { rows, count } = await staffRepository.findAndCount({ where, limit, offset });

  return {
    staff: rows,
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit),
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
  phone?: string;
  role: string;
  specialty?: string;
  hireDate: string;
  address?: string;
  notes?: string;
  staffStatus?: string;
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
    hireDate: data.hireDate,
    address: data.address || null,
    notes: data.notes || null,
    staffStatus: data.staffStatus || 'active',
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
  if (data.hireDate !== undefined) profileFields.hireDate = data.hireDate;
  if (data.address !== undefined) profileFields.address = data.address;
  if (data.notes !== undefined) profileFields.notes = data.notes;
  if (data.staffStatus !== undefined) profileFields.staffStatus = data.staffStatus;

  const result = await staffRepository.updateWithProfile(id, userFields, profileFields);
  if (!result) throw new Error('Không tìm thấy nhân viên');
  return result;
};

export const getStaffStats = async () => {
  return staffRepository.countByRole();
};
