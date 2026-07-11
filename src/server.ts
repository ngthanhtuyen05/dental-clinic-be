import app from './app.js';
import dotenv from 'dotenv';
import sequelize, { connectDB } from './config/db.js';
import { seedAdmin } from './utils/seeder.js';

// Import model registry — đăng ký tất cả models + associations tập trung
import './models/index.js';

// Cấu hình dotenv để đọc file .env
dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  try {
    // 1. Kết nối cơ sở dữ liệu
    await connectDB();

    // 2. Đồng bộ các Model với Database (Tự động tạo bảng nếu chưa có)
    // Lưu ý: { alter: true } giúp cập nhật cấu trúc bảng mà không làm mất dữ liệu hiện tại
    // TODO: Chuyển sang migration tool (Sequelize CLI / Umzug) cho production
    await sequelize.sync({ alter: true });
    console.log('[Database] All models were synchronized successfully.');

    // Seed tài khoản admin mặc định
    await seedAdmin();

    // 3. Khởi chạy server lắng nghe
    app.listen(PORT, () => {
      console.log(`[Server] running on http://localhost:${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error: any) {
    console.error('[Server] Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
