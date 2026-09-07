import { QueryInterface, Sequelize } from 'sequelize';

export const name = '004_add_doctor_profile_fields';

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

export async function up(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  for (const col of staffColumns) {
    try {
      await sequelize.query(`ALTER TABLE StaffProfiles ADD COLUMN ${col};`);
    } catch (error: any) {
      if (!error.message?.includes('Duplicate column') && !error.message?.includes('already exists')) {
        throw error;
      }
    }
  }
}

export async function down(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  for (const col of staffColumns) {
    const colName = col.split(' ')[0];
    try {
      await queryInterface.removeColumn('StaffProfiles', colName);
    } catch (_) {}
  }
}
