import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 10;

/** Sinh mật khẩu tạm ngẫu nhiên, đủ mạnh, dùng khi reset mật khẩu nhân viên. */
export const generateRandomPassword = (length = 12): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  const bytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
};

export const hashPassword = async (plain: string): Promise<string> => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plain, salt);
};

export const comparePassword = async (plain: string, hashed: string): Promise<boolean> => {
  return bcrypt.compare(plain, hashed);
};
