import { QueryInterface, Sequelize, DataTypes } from 'sequelize';

export const name = '012_add_clinical_safety_fields_to_products';

/**
 * Hai trường phục vụ đối chiếu chống chỉ định khi kê đơn:
 * - activeIngredient: hoạt chất (bệnh nhân thường khai dị ứng theo hoạt chất "Penicillin"
 *   trong khi thuốc trong kho mang tên thương mại "Amoxicillin 500mg").
 * - pregnancyContraindicated: thuốc chống chỉ định cho phụ nữ mang thai.
 */
export async function up(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  for (const [column, spec] of Object.entries({
    activeIngredient: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: null,
    },
    pregnancyContraindicated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  })) {
    try {
      await queryInterface.addColumn('Products', column, spec as any);
    } catch (error: any) {
      if (!error.message?.includes('Duplicate column') && !error.message?.includes('already exists')) {
        throw error;
      }
    }
  }
}

export async function down(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  for (const column of ['activeIngredient', 'pregnancyContraindicated']) {
    try {
      await queryInterface.removeColumn('Products', column);
    } catch (_) {}
  }
}
