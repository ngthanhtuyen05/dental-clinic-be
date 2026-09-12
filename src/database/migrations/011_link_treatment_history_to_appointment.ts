import { QueryInterface, Sequelize, DataTypes } from 'sequelize';

export const name = '011_link_treatment_history_to_appointment';

/**
 * Nối "Lịch hẹn khám" với "Lần khám": mỗi lịch hẹn hoàn thành sinh đúng 1 bản ghi
 * TreatmentHistory. Ràng buộc UNIQUE đảm bảo không sinh trùng khi status bị cập nhật
 * lặp hoặc có 2 request COMPLETED chạy song song.
 */
export async function up(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  try {
    await queryInterface.addColumn('TreatmentHistories', 'appointmentId', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Appointments', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate column') && !error.message?.includes('already exists')) {
      throw error;
    }
  }

  try {
    await queryInterface.addIndex('TreatmentHistories', ['appointmentId'], {
      name: 'uq_treatment_histories_appointment',
      unique: true,
    });
  } catch (error: any) {
    if (!error.message?.includes('Duplicate key name') && !error.message?.includes('already exists')) {
      throw error;
    }
  }
}

export async function down(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  try {
    await queryInterface.removeIndex('TreatmentHistories', 'uq_treatment_histories_appointment');
  } catch (_) {}
  try {
    await queryInterface.removeColumn('TreatmentHistories', 'appointmentId');
  } catch (_) {}
}
