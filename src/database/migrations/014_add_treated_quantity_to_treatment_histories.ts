import { QueryInterface, Sequelize, DataTypes } from 'sequelize';

export const name = '014_add_treated_quantity_to_treatment_histories';

/**
 * Ghi nhận SỐ LƯỢNG ĐƠN VỊ đã điều trị thực tế (VD: số răng đã bọc sứ) tại thời điểm bác sĩ
 * xác nhận hoàn thành ca khám. Trước đây TreatmentHistory.cost luôn = Service.price (đơn giá
 * 1 đơn vị), dù dịch vụ tính theo răng/hàm và bệnh nhân có thể điều trị nhiều hơn 1 đơn vị
 * trong cùng 1 lượt khám — số răng thực tế chỉ bác sĩ mới biết chính xác SAU khi khám xong,
 * không thể thu thập từ lúc đặt lịch.
 */
export async function up(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  try {
    await queryInterface.addColumn('TreatmentHistories', 'treatedQuantity', {
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
    await queryInterface.removeColumn('TreatmentHistories', 'treatedQuantity');
  } catch (_) {}
}
