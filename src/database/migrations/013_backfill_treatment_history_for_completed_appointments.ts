import { QueryInterface, Sequelize } from 'sequelize';

export const name = '013_backfill_treatment_history_for_completed_appointments';

/**
 * Backfill "lần khám" cho các lịch hẹn đã COMPLETED TRƯỚC khi có cơ chế tự sinh
 * (migration 011 + updateAppointmentStatus).
 *
 * Không có bước này thì tab "Lịch sử khám" của những bệnh nhân đã khám xong từ trước vẫn
 * rỗng vĩnh viễn, và các đơn thuốc kê trong những lần khám đó vẫn mồ côi treatmentHistoryId.
 *
 * Điều kiện lọc `th.id IS NULL` khiến migration chạy lại nhiều lần cũng không sinh trùng.
 * Lịch hẹn có bệnh nhân chưa có hồ sơ bệnh án sẽ bị bỏ qua (INNER JOIN) — không thể tạo lần
 * khám khi không biết gắn vào hồ sơ nào.
 */
export async function up(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  // Đếm trước/sau thay vì đọc affectedRows: với INSERT ... SELECT, Sequelize trả về
  // insertId chứ không phải số dòng, nên log sẽ sai.
  const countVisits = async (): Promise<number> => {
    const rows: any = await queryInterface.sequelize.query(
      'SELECT COUNT(*) AS n FROM TreatmentHistories WHERE appointmentId IS NOT NULL',
      { type: 'SELECT' as any },
    );
    return Number(rows?.[0]?.n ?? 0);
  };
  const countLinkedPrescriptions = async (): Promise<number> => {
    const rows: any = await queryInterface.sequelize.query(
      'SELECT COUNT(*) AS n FROM Prescriptions WHERE appointmentId IS NOT NULL AND treatmentHistoryId IS NOT NULL',
      { type: 'SELECT' as any },
    );
    return Number(rows?.[0]?.n ?? 0);
  };

  const visitsBefore = await countVisits();
  const linkedBefore = await countLinkedPrescriptions();

  await queryInterface.sequelize.query(`
    INSERT INTO TreatmentHistories
      (patientProfileId, dentistId, appointmentId, diagnosis, treatment, cost,
       treatmentDate, notes, createdAt, updatedAt)
    SELECT
      pp.id,
      a.dentistId,
      a.id,
      LEFT(COALESCE(NULLIF(TRIM(a.chiefComplaint), ''), s.name, 'Khám nha khoa'), 255),
      LEFT(COALESCE(s.name, 'Khám nha khoa'), 255),
      COALESCE(s.price, 0),
      COALESCE(a.completedAt, a.updatedAt, a.appointmentDate),
      a.notes,
      NOW(),
      NOW()
    FROM Appointments a
    INNER JOIN PatientProfiles pp ON pp.userId = a.patientId
    LEFT JOIN Services s ON s.id = a.serviceId
    LEFT JOIN TreatmentHistories th ON th.appointmentId = a.id
    WHERE a.status = 'completed'
      AND th.id IS NULL;
  `);

  // Nối lại các đơn thuốc đã kê cho những lịch hẹn đó vào đúng lần khám vừa tạo.
  await queryInterface.sequelize.query(`
    UPDATE Prescriptions p
    INNER JOIN TreatmentHistories th ON th.appointmentId = p.appointmentId
    SET p.treatmentHistoryId = th.id
    WHERE p.appointmentId IS NOT NULL
      AND p.treatmentHistoryId IS NULL;
  `);

  const skipped: any = await queryInterface.sequelize.query(`
    SELECT COUNT(*) AS n
    FROM Appointments a
    LEFT JOIN PatientProfiles pp ON pp.userId = a.patientId
    WHERE a.status = 'completed' AND pp.id IS NULL;
  `, { type: 'SELECT' as any });

  console.log(`[013] Đã tạo ${(await countVisits()) - visitsBefore} lần khám từ lịch hẹn đã hoàn thành.`);
  console.log(`[013] Đã nối ${(await countLinkedPrescriptions()) - linkedBefore} đơn thuốc vào lần khám tương ứng.`);
  const skippedCount = Number(skipped?.[0]?.n ?? 0);
  if (skippedCount > 0) {
    console.warn(`[013] Bỏ qua ${skippedCount} lịch hẹn đã hoàn thành vì bệnh nhân chưa có hồ sơ bệnh án.`);
  }
}

/**
 * Không tự động xóa: đây là dữ liệu lâm sàng, và sau khi backfill thì lần khám do migration
 * tạo ra không còn phân biệt được với lần khám do hệ thống sinh ra bình thường. Nếu thực sự
 * cần lùi, hãy xóa thủ công theo khoảng thời gian đã biết.
 */
export async function down(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  console.warn('[013] down() không xóa dữ liệu lâm sàng đã backfill — cần xử lý thủ công nếu muốn lùi.');
}
