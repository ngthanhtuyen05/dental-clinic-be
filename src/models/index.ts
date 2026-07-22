import User from './userModel.js';
import PatientProfile from './patientProfileModel.js';
import RefreshToken from './refreshTokenModel.js';
import Appointment from './appointmentModel.js';
import TreatmentHistory from './treatmentHistoryModel.js';
import ServiceCategory from './serviceCategoryModel.js';
import Service from './serviceModel.js';
import StaffProfile from './staffProfileModel.js';
import Specialty from './specialtyModel.js';

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

User.hasMany(Appointment, { as: 'appointmentsCreated', foreignKey: 'createdBy' });
Appointment.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

// Service ↔ Appointment (1:N)
Service.hasMany(Appointment, { foreignKey: 'serviceId', as: 'appointments' });
Appointment.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

// PatientProfile ↔ TreatmentHistory (1:N)
PatientProfile.hasMany(TreatmentHistory, { foreignKey: 'patientProfileId', as: 'treatmentHistories' });
TreatmentHistory.belongsTo(PatientProfile, { foreignKey: 'patientProfileId', as: 'patientProfile' });

// User (dentist) ↔ TreatmentHistory (1:N)
User.hasMany(TreatmentHistory, { foreignKey: 'dentistId', as: 'dentistTreatments' });
TreatmentHistory.belongsTo(User, { foreignKey: 'dentistId', as: 'dentist' });

// ServiceCategory ↔ Service (1:N)
ServiceCategory.hasMany(Service, { foreignKey: 'categoryId', as: 'services' });
Service.belongsTo(ServiceCategory, { foreignKey: 'categoryId', as: 'category' });

// User ↔ StaffProfile (1:1)
User.hasOne(StaffProfile, { foreignKey: 'userId', as: 'staffProfile' });
StaffProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ==================== EXPORTS ====================
export { User, PatientProfile, RefreshToken, Appointment, TreatmentHistory, ServiceCategory, Service, StaffProfile, Specialty };
