/**
 * Response Messages — Tập trung các message trả về cho client.
 * Dễ maintain, dễ mở rộng i18n sau này.
 */
const Messages = {
  // Auth
  AUTH: {
    LOGIN_SUCCESS: 'Đăng nhập thành công',
    LOGOUT_SUCCESS: 'Đăng xuất thành công',
    REGISTER_SUCCESS: 'Đăng ký thành công',
    INVALID_CREDENTIALS: 'Email hoặc mật khẩu không hợp lệ',
    UNAUTHORIZED: 'Bạn chưa đăng nhập! Vui lòng đăng nhập để truy cập.',
    TOKEN_INVALID: 'Token không hợp lệ! Vui lòng đăng nhập lại.',
    TOKEN_EXPIRED: 'Phiên đăng nhập đã hết hạn! Vui lòng làm mới token.',
    SESSION_EXPIRED: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ',
    ACCOUNT_DELETED: 'Tài khoản liên kết với token này đã bị xóa.',
    FORBIDDEN: 'Bạn không có quyền truy cập tài nguyên này.',
    FORBIDDEN_UPDATE: 'Bạn không có quyền cập nhật thông tin của người khác.',
    EMAIL_TAKEN: 'Email đã được sử dụng bởi một tài khoản khác',
  },

  // CRUD chung
  CRUD: {
    NOT_FOUND: (resource: string) => `${resource} không tồn tại`,
    CREATE_SUCCESS: (resource: string) => `Tạo ${resource} thành công`,
    UPDATE_SUCCESS: (resource: string) => `Cập nhật ${resource} thành công`,
    DELETE_SUCCESS: (resource: string) => `Xóa ${resource} thành công`,
    ALREADY_EXISTS: (resource: string) => `${resource} đã tồn tại`,
  },

  // Server
  SERVER: {
    WELCOME: 'Welcome to Dental Clinic API!',
    ROUTE_NOT_FOUND: (url: string) => `Can't find ${url} on this server!`,
    INTERNAL_ERROR: 'Something went very wrong!',
    TOO_MANY_REQUESTS: 'Too many requests from this IP, please try again after 15 minutes',
  },

  // Seeder
  SEEDER: {
    ADMIN_SEEDED: 'Default admin account successfully seeded!',
    ADMIN_EXISTS: 'Admin account already exists. Seeding skipped.',
    EMAIL_TAKEN: (email: string) => `Email ${email} is already taken by another user. Admin seeding skipped.`,
  },
} as const;

export default Messages;
