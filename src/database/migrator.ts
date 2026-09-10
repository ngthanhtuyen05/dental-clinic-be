import { QueryTypes, QueryInterface, Sequelize } from 'sequelize';
import sequelize from '../config/db.js';
import * as m001 from './migrations/001_add_role_id_to_users.js';
import * as m002 from './migrations/002_add_discount_to_invoices.js';
import * as m003 from './migrations/003_add_specialty_slug.js';
import * as m004 from './migrations/004_add_doctor_profile_fields.js';
import * as m005 from './migrations/005_add_performance_indexes.js';
import * as m006 from './migrations/006_add_selling_price_to_products.js';
import * as m007 from './migrations/007_add_unit_conversion_to_products.js';

export interface MigrationModule {
  name: string;
  up: (queryInterface: QueryInterface, sequelize: Sequelize) => Promise<void>;
  down: (queryInterface: QueryInterface, sequelize: Sequelize) => Promise<void>;
}

export const registeredMigrations: MigrationModule[] = [
  m001,
  m002,
  m003,
  m004,
  m005,
  m006,
  m007,
];


/**
 * Đảm bảo bảng SequelizeMeta tồn tại để ghi nhận lịch sử các migration đã chạy
 */
async function ensureMetaTable(): Promise<void> {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS SequelizeMeta (
      name VARCHAR(255) NOT NULL PRIMARY KEY,
      executedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * Thực thi tất cả các migrations chưa được chạy
 */
export async function runMigrations(): Promise<void> {
  await ensureMetaTable();

  const executedRows = await sequelize.query<{ name: string }>(
    'SELECT name FROM SequelizeMeta',
    { type: QueryTypes.SELECT }
  );
  const executedSet = new Set(executedRows.map((r) => r.name));

  const queryInterface = sequelize.getQueryInterface();
  let pendingCount = 0;

  for (const migration of registeredMigrations) {
    if (!executedSet.has(migration.name)) {
      pendingCount++;
      console.log(`[Migration] Running: ${migration.name}...`);
      await migration.up(queryInterface, sequelize);
      await sequelize.query(
        'INSERT INTO SequelizeMeta (name) VALUES (?)',
        { replacements: [migration.name] }
      );
      console.log(`[Migration] Completed: ${migration.name}`);
    }
  }

  if (pendingCount === 0) {
    console.log('[Migration] Database is up to date (0 pending migrations).');
  } else {
    console.log(`[Migration] Successfully applied ${pendingCount} migration(s).`);
  }
}

/**
 * Hoàn tác migration gần nhất (Undo / Rollback)
 */
export async function revertLastMigration(): Promise<void> {
  await ensureMetaTable();

  const rows = await sequelize.query<{ name: string }>(
    'SELECT name FROM SequelizeMeta ORDER BY executedAt DESC, name DESC LIMIT 1',
    { type: QueryTypes.SELECT }
  );

  if (!rows || rows.length === 0) {
    console.log('[Migration] No migrations to revert.');
    return;
  }

  const lastMigrationName = rows[0].name;
  const migration = registeredMigrations.find((m) => m.name === lastMigrationName);

  if (!migration) {
    console.error(`[Migration] Migration ${lastMigrationName} not found in registered migrations.`);
    return;
  }

  console.log(`[Migration] Reverting: ${migration.name}...`);
  const queryInterface = sequelize.getQueryInterface();
  await migration.down(queryInterface, sequelize);
  await sequelize.query(
    'DELETE FROM SequelizeMeta WHERE name = ?',
    { replacements: [migration.name] }
  );
  console.log(`[Migration] Successfully reverted: ${migration.name}`);
}
