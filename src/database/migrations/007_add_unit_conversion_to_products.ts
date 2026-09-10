import { QueryInterface, Sequelize, DataTypes } from 'sequelize';

export const name = '007_add_unit_conversion_to_products';

export async function up(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  try {
    await queryInterface.addColumn('Products', 'importUnit', {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null,
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate column') && !error.message?.includes('already exists')) {
      throw error;
    }
  }

  try {
    await queryInterface.addColumn('Products', 'conversionRate', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate column') && !error.message?.includes('already exists')) {
      throw error;
    }
  }
}

export async function down(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  try {
    await queryInterface.removeColumn('Products', 'importUnit');
  } catch (_) {}

  try {
    await queryInterface.removeColumn('Products', 'conversionRate');
  } catch (_) {}
}
