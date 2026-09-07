import dotenv from 'dotenv';

// Load .env ngay khi module được import
dotenv.config();

// ============================================================
// Centralized Environment Configuration
// Validate và export tất cả env variables tại 1 nơi duy nhất.
// Nếu thiếu biến bắt buộc → crash sớm thay vì lỗi runtime.
// ============================================================

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`[Config] Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvVarAsNumber(key: string, defaultValue?: number): number {
  const raw = process.env[key];
  if (raw !== undefined) {
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed)) {
      throw new Error(`[Config] Environment variable ${key} must be a number, got: "${raw}"`);
    }
    return parsed;
  }
  if (defaultValue !== undefined) return defaultValue;
  throw new Error(`[Config] Missing required environment variable: ${key}`);
}

const env = {
  // Server
  PORT: getEnvVarAsNumber('PORT', 5000),
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),

  // Database
  DB_HOST: getEnvVar('DB_HOST', 'localhost'),
  DB_PORT: getEnvVarAsNumber('DB_PORT', 3306),
  DB_USER: getEnvVar('DB_USER', 'root'),
  DB_PASSWORD: getEnvVar('DB_PASSWORD', ''),
  DB_NAME: getEnvVar('DB_NAME', 'dental_clinic'),

  // JWT
  JWT_SECRET: getEnvVar('JWT_SECRET'),
  JWT_EXPIRES_IN: getEnvVar('JWT_EXPIRES_IN', '15m'),
  JWT_REFRESH_SECRET: getEnvVar('JWT_REFRESH_SECRET'),
  JWT_REFRESH_EXPIRES_IN: getEnvVar('JWT_REFRESH_EXPIRES_IN', '7d'),

  // Admin Seed
  ADMIN_EMAIL: getEnvVar('ADMIN_EMAIL', 'admin@dentalclinic.com'),
  ADMIN_PASSWORD: getEnvVar('ADMIN_PASSWORD', 'Admin@123456'),

  // Client & CORS
  CLIENT_URL: getEnvVar('CLIENT_URL', 'http://localhost:5173'),

  // MoMo Payment Gateway
  MOMO_PARTNER_CODE: getEnvVar('MOMO_PARTNER_CODE', 'MOMO'),
  MOMO_ACCESS_KEY: getEnvVar('MOMO_ACCESS_KEY', 'F8BBA84267B81121'),
  MOMO_SECRET_KEY: getEnvVar('MOMO_SECRET_KEY', 'K951B6PE1waDMi640xX0873WAFYgDRvd'),
  MOMO_ENDPOINT: getEnvVar('MOMO_ENDPOINT', 'https://test-payment.momo.vn/v2/gateway/api/create'),

  // Computed helpers
  get isDevelopment(): boolean {
    return this.NODE_ENV === 'development';
  },
  get isProduction(): boolean {
    return this.NODE_ENV === 'production';
  },
} as const;

export default env;
