import { QueryInterface, Sequelize, DataTypes } from 'sequelize';

export const name = '009_add_odontogram_to_patient_profiles';

export async function up(queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  try {
    await queryInterface.addColumn('PatientProfiles', 'odontogram', {
      type: DataTypes.JSON,
      allowNull: true,
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate column') && !error.message?.includes('already exists')) {
      throw error;
    }
  }
}

export async function down(queryInterface: QueryInterface, _sequelize: Sequelize): Promise<void> {
  try {
    await queryInterface.removeColumn('PatientProfiles', 'odontogram');
  } catch (_) {}
}
