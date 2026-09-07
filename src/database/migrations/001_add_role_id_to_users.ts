import { QueryInterface, Sequelize, DataTypes } from 'sequelize';

export const name = '001_add_role_id_to_users';

export async function up(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  try {
    await queryInterface.addColumn('Users', 'roleId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate column') && !error.message?.includes('already exists')) {
      throw error;
    }
  }
}

export async function down(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  try {
    await queryInterface.removeColumn('Users', 'roleId');
  } catch (_) {}
}
