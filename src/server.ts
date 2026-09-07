// Import env config ĐẦU TIÊN — validate env variables trước khi làm bất cứ gì
import env from './config/env.js';

import http from 'http';
import app from './app.js';
import sequelize, { connectDB } from './config/db.js';
import { seedAdmin } from './utils/seeder.js';
import { initSocket } from './services/socketService.js';
import { runMigrations } from './database/migrator.js';

// Import model registry — đăng ký tất cả models + associations tập trung
import './models/index.js';

const startServer = async (): Promise<void> => {
  try {
    // 1. Kết nối cơ sở dữ liệu
    await connectDB();

    // 2. Đồng bộ các Model với Database (Tự động tạo bảng nếu chưa có)
    await sequelize.sync();
    console.log('[Database] All models were synchronized successfully.');

    // 3. Thực thi Database Migrations theo phiên bản (SequelizeMeta)
    await runMigrations();

    // 4. Seed tài khoản admin mặc định
    await seedAdmin();

    // 5. Khởi chạy HTTP server & Socket.IO
    const httpServer = http.createServer(app);
    initSocket(httpServer);

    httpServer.listen(env.PORT, () => {
      console.log(`[Server] running on http://localhost:${env.PORT}`);
      console.log(`[Server] Environment: ${env.NODE_ENV}`);
    });
  } catch (error: any) {
    console.error('[Server] Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
