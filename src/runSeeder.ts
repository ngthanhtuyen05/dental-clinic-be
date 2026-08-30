import env from './config/env.js';
import sequelize, { connectDB } from './config/db.js';
import { seedAdmin } from './utils/seeder.js';
import './models/index.js';

const run = async () => {
  try {
    await connectDB();
    await sequelize.sync();
    try {
      await sequelize.query(`ALTER TABLE Users ADD COLUMN roleId INT NULL;`);
    } catch (_) {}
    await seedAdmin();
    console.log('[Seeder] Completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('[Seeder] Failed:', err);
    process.exit(1);
  }
};

run();
