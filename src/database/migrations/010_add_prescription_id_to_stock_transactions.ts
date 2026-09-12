import { QueryInterface, Sequelize, DataTypes } from 'sequelize';

export const name = '010_add_prescription_id_to_stock_transactions';

export async function up(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  try {
    await queryInterface.addColumn('StockTransactions', 'prescriptionId', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Prescriptions', key: 'id' },
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate column') && !error.message?.includes('already exists')) {
      throw error;
    }
  }
}

export async function down(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  try {
    await queryInterface.removeColumn('StockTransactions', 'prescriptionId');
  } catch (_) {}
}
