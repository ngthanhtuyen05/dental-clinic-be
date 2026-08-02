// Import env config ĐẦU TIÊN — validate env variables trước khi làm bất cứ gì
import env from './config/env.js';

import app from './app.js';
import sequelize, { connectDB } from './config/db.js';
import { seedAdmin } from './utils/seeder.js';

// Import model registry — đăng ký tất cả models + associations tập trung
import './models/index.js';

const startServer = async (): Promise<void> => {
  try {
    // 1. Kết nối cơ sở dữ liệu
    await connectDB();

    // 2. Đồng bộ các Model với Database (Tự động tạo bảng nếu chưa có)
    await sequelize.sync();
    console.log('[Database] All models were synchronized successfully.');

    // Migration an toàn cho các cột mới thêm vào bảng Invoices
    try {
      await sequelize.query(`ALTER TABLE Invoices ADD COLUMN discountAmount DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER totalAmount;`);
    } catch (_) {
      // Cột đã tồn tại
    }

    // Seed tài khoản admin mặc định
    await seedAdmin();

    // 3. Khởi chạy server lắng nghe
    app.listen(env.PORT, () => {
      console.log(`[Server] running on http://localhost:${env.PORT}`);
      console.log(`[Server] Environment: ${env.NODE_ENV}`);
    });
  } catch (error: any) {
    console.error('[Server] Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
