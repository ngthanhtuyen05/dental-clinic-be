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

    // Migration an toàn cho cột slug trong Specialties
    try {
      await sequelize.query(`ALTER TABLE Specialties ADD COLUMN slug VARCHAR(120) NULL;`);
    } catch (_) {}
    try {
      const [specialties]: any = await sequelize.query(`SELECT id, name, slug FROM Specialties;`);
      for (const spec of specialties) {
        if (!spec.slug && spec.name) {
          const genSlug = spec.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[đĐ]/g, 'd')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
          await sequelize.query(`UPDATE Specialties SET slug = ? WHERE id = ?;`, {
            replacements: [genSlug, spec.id],
          });
        }
      }
    } catch (_) {}

    // Migration an toàn cho các cột Bác sĩ mới trong StaffProfiles
    const staffColumns = [
      'gender VARCHAR(20) NULL',
      'dateOfBirth DATE NULL',
      'academicTitle VARCHAR(50) NULL',
      'licenseNumber VARCHAR(50) NULL',
      'licenseDate DATE NULL',
      'experienceYears INT DEFAULT 0',
      'avatar LONGTEXT NULL',
      'badge VARCHAR(100) NULL',
      'bio TEXT NULL',
      'quote VARCHAR(255) NULL',
      'education JSON NULL',
      'certificates JSON NULL',
      'achievements JSON NULL',
      'workingSchedule VARCHAR(255) NULL',
      'slotDuration INT DEFAULT 30',
      'subSpecialties JSON NULL',
    ];
    for (const col of staffColumns) {
      try {
        await sequelize.query(`ALTER TABLE StaffProfiles ADD COLUMN ${col};`);
      } catch (_) {}
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
