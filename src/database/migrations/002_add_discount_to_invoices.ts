import { QueryInterface, Sequelize, DataTypes } from 'sequelize';

export const name = '002_add_discount_to_invoices';

export async function up(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  try {
    await queryInterface.addColumn('Invoices', 'discountAmount', {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate column') && !error.message?.includes('already exists')) {
      throw error;
    }
  }
}

export async function down(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  try {
    await queryInterface.removeColumn('Invoices', 'discountAmount');
  } catch (_) {}
}
