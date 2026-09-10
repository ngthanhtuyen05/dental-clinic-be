import { QueryInterface, Sequelize, DataTypes } from 'sequelize';

export const name = '006_add_selling_price_to_products';

export async function up(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  try {
    await queryInterface.addColumn('Products', 'sellingPrice', {
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
    await queryInterface.removeColumn('Products', 'sellingPrice');
  } catch (_) {}
}
