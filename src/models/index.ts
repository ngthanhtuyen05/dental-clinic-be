/**
 * models/index.ts — Central Model Registry & Associations
 * 
 * Tất cả model associations được define TẬP TRUNG ở đây.
 * Các file model riêng lẻ chỉ define schema, KHÔNG define associations.
 * Import models từ file này thay vì import trực tiếp từ từng file model.
 */
import User from './userModel.js';
import PatientProfile from './patientProfileModel.js';
import RefreshToken from './refreshTokenModel.js';
import Appointment from './appointmentModel.js';
import TreatmentHistory from './treatmentHistoryModel.js';

// ==================== ASSOCIATIONS ====================

// User ↔ PatientProfile (1:1)
User.hasOne(PatientProfile, { foreignKey: 'userId', as: 'patientProfile' });
PatientProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User ↔ RefreshToken (1:N)
User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User ↔ Appointment (1:N — patient & dentist)
User.hasMany(Appointment, { as: 'appointmentsAsPatient', foreignKey: 'patientId' });
User.hasMany(Appointment, { as: 'appointmentsAsDentist', foreignKey: 'dentistId' });
Appointment.belongsTo(User, { as: 'patient', foreignKey: 'patientId' });
Appointment.belongsTo(User, { as: 'dentist', foreignKey: 'dentistId' });

// PatientProfile ↔ TreatmentHistory (1:N)
PatientProfile.hasMany(TreatmentHistory, { foreignKey: 'patientProfileId', as: 'treatmentHistories' });
TreatmentHistory.belongsTo(PatientProfile, { foreignKey: 'patientProfileId', as: 'patientProfile' });

// User (dentist) ↔ TreatmentHistory (1:N)
User.hasMany(TreatmentHistory, { foreignKey: 'dentistId', as: 'dentistTreatments' });
TreatmentHistory.belongsTo(User, { foreignKey: 'dentistId', as: 'dentist' });

// ==================== EXPORTS ====================
export { User, PatientProfile, RefreshToken, Appointment, TreatmentHistory };
