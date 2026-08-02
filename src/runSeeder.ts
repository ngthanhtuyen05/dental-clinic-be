import env from './config/env.js';
import { connectDB } from './config/db.js';
import { seedAdmin } from './utils/seeder.js';
import './models/index.js';

const run = async () => {
  try {
    await connectDB();
    await seedAdmin();
    console.log('[Seeder] Completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('[Seeder] Failed:', err);
    process.exit(1);
  }
};

run();
