import { settingRepository } from '../repositories/settingRepository.js';
import AppError from '../utils/AppError.js';
import HttpStatus from '../constants/httpStatus.js';

export const getAllSettings = async (): Promise<Record<string, any>> => {
  const settingsList = await settingRepository.findAll();
  const settingsMap: Record<string, any> = {};

  for (const s of settingsList) {
    settingsMap[s.key] = {
      value: s.value,
      description: s.description,
      updatedBy: s.updatedBy,
      updater: (s as any).updater || null,
      updatedAt: s.updatedAt,
    };
  }

  return settingsMap;
};

export const getSettingByKey = async (key: string): Promise<any> => {
  const setting = await settingRepository.findByKey(key);
  if (!setting) {
    throw new AppError(`Không tìm thấy cấu hình với mã '${key}'`, HttpStatus.NOT_FOUND);
  }
  return {
    key: setting.key,
    value: setting.value,
    description: setting.description,
    updatedBy: setting.updatedBy,
    updater: (setting as any).updater || null,
    updatedAt: setting.updatedAt,
  };
};

export const updateSetting = async (
  key: string,
  value: any,
  updatedBy?: number,
  description?: string
): Promise<any> => {
  if (!key || typeof key !== 'string') {
    throw new AppError('Mã cấu hình không hợp lệ', HttpStatus.BAD_REQUEST);
  }

  const updated = await settingRepository.upsert(key, value, description, updatedBy);
  return {
    key: updated.key,
    value: updated.value,
    description: updated.description,
    updatedBy: updated.updatedBy,
    updatedAt: updated.updatedAt,
  };
};

export const getPublicClinicInfo = async (): Promise<any> => {
  const setting = await settingRepository.findByKey('clinic');
  if (!setting) {
    // Return default fallback if not configured
    return {
      name: 'Nha Khoa Quốc Tế Smilevia',
      slogan: 'Nụ cười rạng rỡ - Tự tin tỏa sáng',
      phone: '1900 6868 - 028 7302 6868',
      email: 'contact@smilevia.vn',
      website: 'https://smilevia.vn',
      address: '128 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP. Hồ Chí Minh',
      branch2: '45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      openTime: '08:00',
      closeTime: '20:00',
      breakStart: '12:00',
      breakEnd: '13:30',
      autoConfirm: true,
      allowOnlineBooking: true,
    };
  }
  return setting.value;
};
