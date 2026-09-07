import { QueryInterface, Sequelize } from 'sequelize';

export const name = '005_add_performance_indexes';

const performanceIndexes = [
  { table: 'Appointments', name: 'idx_appointments_date_dentist_status', sql: 'CREATE INDEX idx_appointments_date_dentist_status ON Appointments (appointmentDate, dentistId, status);' },
  { table: 'Appointments', name: 'idx_appointments_patient_date', sql: 'CREATE INDEX idx_appointments_patient_date ON Appointments (patientId, appointmentDate);' },
  { table: 'Appointments', name: 'idx_appointments_date_starttime', sql: 'CREATE INDEX idx_appointments_date_starttime ON Appointments (appointmentDate, startTime);' },
  { table: 'TreatmentHistories', name: 'idx_treatments_date_dentist', sql: 'CREATE INDEX idx_treatments_date_dentist ON TreatmentHistories (treatmentDate, dentistId);' },
  { table: 'TreatmentHistories', name: 'idx_treatments_patient_date', sql: 'CREATE INDEX idx_treatments_patient_date ON TreatmentHistories (patientProfileId, treatmentDate);' },
  { table: 'PatientProfiles', name: 'idx_patient_profiles_dob', sql: 'CREATE INDEX idx_patient_profiles_dob ON PatientProfiles (dateOfBirth);' },
  { table: 'Invoices', name: 'idx_invoices_created_status', sql: 'CREATE INDEX idx_invoices_created_status ON Invoices (createdAt, status);' },
  { table: 'Invoices', name: 'idx_invoices_patient_created', sql: 'CREATE INDEX idx_invoices_patient_created ON Invoices (patientProfileId, createdAt);' },
];

export async function up(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  for (const idx of performanceIndexes) {
    try {
      await sequelize.query(idx.sql);
    } catch (error: any) {
      if (!error.message?.includes('Duplicate key') && !error.message?.includes('already exists')) {
        throw error;
      }
    }
  }
}

export async function down(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
  for (const idx of performanceIndexes) {
    try {
      await queryInterface.removeIndex(idx.table, idx.name);
    } catch (_) {}
  }
}
