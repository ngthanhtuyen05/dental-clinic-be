import env from '../config/env.js';
import sequelize, { connectDB } from '../config/db.js';
import { runMigrations, revertLastMigration } from './migrator.js';

// Import model registry
import '../models/index.js';

async function main(): Promise<void> {
  try {
    await connectDB();

    const isUndo = process.argv.includes('--undo') || process.argv.includes('-u');
    if (isUndo) {
      await revertLastMigration();
    } else {
      await runMigrations();
    }

    await sequelize.close();
    process.exit(0);
  } catch (error: any) {
    console.error('[Migration CLI] Failed to run migration:', error.message);
    process.exit(1);
  }
}

main();
