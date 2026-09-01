import User from './userModel.js';
import Role from './roleModel.js';
import PatientProfile from './patientProfileModel.js';
import RefreshToken from './refreshTokenModel.js';
import Appointment from './appointmentModel.js';
import TreatmentHistory from './treatmentHistoryModel.js';
import ServiceCategory from './serviceCategoryModel.js';
import Service from './serviceModel.js';
import StaffProfile from './staffProfileModel.js';
import Specialty from './specialtyModel.js';
import Supplier from './supplierModel.js';
import Product from './productModel.js';
import StockBatch from './stockBatchModel.js';
import StockTransaction from './stockTransactionModel.js';
import Prescription from './prescriptionModel.js';
import PrescriptionItem from './prescriptionItemModel.js';
import DosageTemplate from './dosageTemplateModel.js';
import UsageGuide from './usageGuideModel.js';
import Invoice from './invoiceModel.js';
import Setting from './settingModel.js';

// ==================== ASSOCIATIONS ====================

// Role ↔ User (1:N)
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'roleInfo' });

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

// StaffProfile ↔ Specialty (N:1)
StaffProfile.belongsTo(Specialty, { foreignKey: 'specialtyId', as: 'specialtyInfo' });
Specialty.hasMany(StaffProfile, { foreignKey: 'specialtyId', as: 'staffProfiles' });

// Supplier ↔ Product (1:N)
Supplier.hasMany(Product, { foreignKey: 'supplierId', as: 'products' });
Product.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

// Product ↔ StockBatch (1:N)
Product.hasMany(StockBatch, { foreignKey: 'productId', as: 'batches' });
StockBatch.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Product ↔ StockTransaction (1:N)
Product.hasMany(StockTransaction, { foreignKey: 'productId', as: 'transactions' });
StockTransaction.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// StockBatch ↔ StockTransaction (1:N)
StockBatch.hasMany(StockTransaction, { foreignKey: 'batchId', as: 'transactions' });
StockTransaction.belongsTo(StockBatch, { foreignKey: 'batchId', as: 'batch' });

// User ↔ StockTransaction (1:N)
User.hasMany(StockTransaction, { foreignKey: 'performedBy', as: 'stockTransactions' });
StockTransaction.belongsTo(User, { foreignKey: 'performedBy', as: 'performer' });

// Prescription Associations
PatientProfile.hasMany(Prescription, { foreignKey: 'patientProfileId', as: 'prescriptions' });
Prescription.belongsTo(PatientProfile, { foreignKey: 'patientProfileId', as: 'patientProfile' });

User.hasMany(Prescription, { foreignKey: 'dentistId', as: 'dentistPrescriptions' });
Prescription.belongsTo(User, { foreignKey: 'dentistId', as: 'dentist' });

Appointment.hasMany(Prescription, { foreignKey: 'appointmentId', as: 'prescriptions' });
Prescription.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

TreatmentHistory.hasMany(Prescription, { foreignKey: 'treatmentHistoryId', as: 'prescriptions' });
Prescription.belongsTo(TreatmentHistory, { foreignKey: 'treatmentHistoryId', as: 'treatmentHistory' });

Prescription.hasMany(PrescriptionItem, { foreignKey: 'prescriptionId', as: 'items' });
PrescriptionItem.belongsTo(Prescription, { foreignKey: 'prescriptionId', as: 'prescription' });

Product.hasMany(PrescriptionItem, { foreignKey: 'productId', as: 'prescriptionItems' });
PrescriptionItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Invoice Associations
PatientProfile.hasMany(Invoice, { foreignKey: 'patientProfileId', as: 'invoices' });
Invoice.belongsTo(PatientProfile, { foreignKey: 'patientProfileId', as: 'patientProfile' });

Appointment.hasMany(Invoice, { foreignKey: 'appointmentId', as: 'invoices' });
Invoice.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

TreatmentHistory.hasMany(Invoice, { foreignKey: 'treatmentHistoryId', as: 'invoices' });
Invoice.belongsTo(TreatmentHistory, { foreignKey: 'treatmentHistoryId', as: 'treatmentHistory' });

Prescription.hasMany(Invoice, { foreignKey: 'prescriptionId', as: 'invoices' });
Invoice.belongsTo(Prescription, { foreignKey: 'prescriptionId', as: 'prescription' });

User.hasMany(Invoice, { foreignKey: 'createdBy', as: 'createdInvoices' });
Invoice.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Setting Associations
User.hasMany(Setting, { foreignKey: 'updatedBy', as: 'updatedSettings' });
Setting.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// ==================== EXPORTS ====================
export {
  User,
  Role,
  PatientProfile,
  RefreshToken,
  Appointment,
  TreatmentHistory,
  ServiceCategory,
  Service,
  StaffProfile,
  Specialty,
  Supplier,
  Product,
  StockBatch,
  StockTransaction,
  Prescription,
  PrescriptionItem,
  DosageTemplate,
  UsageGuide,
  Invoice,
  Setting,
};

