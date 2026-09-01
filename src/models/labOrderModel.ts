import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/db.js';

export interface LabOrderModel extends Model<InferAttributes<LabOrderModel>, InferCreationAttributes<LabOrderModel>> {
  id: CreationOptional<number>;
  code: string;
  patientProfileId: number;
  dentistId: number;
  treatmentHistoryId: CreationOptional<number | null>;
  supplierId: number;

  restorationCategory: string;
  restorationTypeName: string;
  materialName: string;
  teethNumbers: number[];
  totalUnits: CreationOptional<number>;

  shadeSystem: CreationOptional<string>;
  shadeMain: string;
  shadeCervical: CreationOptional<string | null>;
  shadeBody: CreationOptional<string | null>;
  shadeIncisal: CreationOptional<string | null>;
  translucencyLevel: CreationOptional<string>;
  characterizationNotes: CreationOptional<string | null>;

  marginDesign: CreationOptional<string>;
  occlusionType: CreationOptional<string>;
  proximalContact: CreationOptional<string>;
  ponticDesign: CreationOptional<string | null>;

  sentDate: string;
  frameworkTryInDate: CreationOptional<string | null>;
  deliveryDueDate: string;
  actualDeliveryDate: CreationOptional<string | null>;
  patientAppointmentDate: CreationOptional<string | null>;

  status: CreationOptional<string>;
  unitCostPrice: CreationOptional<number>;
  totalCostPrice: CreationOptional<number>;
  isPaidToLab: CreationOptional<boolean>;

  dentistRating: CreationOptional<number | null>;
  dentistFeedback: CreationOptional<string | null>;
  digitalScanFileUrl: CreationOptional<string | null>;
  shadePhotoUrls: CreationOptional<string[] | null>;
  clinicalNotes: CreationOptional<string | null>;
  createdBy: CreationOptional<number | null>;

  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
}

const LabOrder = sequelize.define<LabOrderModel>(
  'LabOrder',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    patientProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'PatientProfiles', key: 'id' },
    },
    dentistId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    treatmentHistoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'TreatmentHistories', key: 'id' },
    },
    supplierId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Suppliers', key: 'id' },
    },
    restorationCategory: {
      type: DataTypes.ENUM('fixed_crown_bridge', 'veneer_inlay', 'removable_denture', 'implant_prosthetics', 'ortho_appliance'),
      allowNull: false,
      defaultValue: 'fixed_crown_bridge',
    },
    restorationTypeName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    materialName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    teethNumbers: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    totalUnits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    shadeSystem: {
      type: DataTypes.ENUM('vita_classical', 'vita_3d_master', 'bleach', 'custom'),
      allowNull: false,
      defaultValue: 'vita_classical',
    },
    shadeMain: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    shadeCervical: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    shadeBody: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    shadeIncisal: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    translucencyLevel: {
      type: DataTypes.ENUM('high', 'medium', 'low', 'opaque'),
      allowNull: false,
      defaultValue: 'medium',
    },
    characterizationNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    marginDesign: {
      type: DataTypes.ENUM('shoulder', 'chamfer', 'knife_edge', 'feather'),
      allowNull: false,
      defaultValue: 'shoulder',
    },
    occlusionType: {
      type: DataTypes.ENUM('normal', 'relieved_light', 'heavy_contact'),
      allowNull: false,
      defaultValue: 'normal',
    },
    proximalContact: {
      type: DataTypes.ENUM('point_normal', 'broad_flat', 'tight', 'light'),
      allowNull: false,
      defaultValue: 'point_normal',
    },
    ponticDesign: {
      type: DataTypes.ENUM('modified_ridge_lap', 'sanitary', 'ovate', 'ridge_lap'),
      allowNull: true,
    },
    sentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    frameworkTryInDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    deliveryDueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    actualDeliveryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    patientAppointmentDate: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        'draft',
        'sent_to_lab',
        'lab_received',
        'in_fabrication',
        'framework_try_in',
        'delivered_to_clinic',
        'clinical_try_in',
        'adjustment_needed',
        'remake_needed',
        'cemented_done',
        'cancelled'
      ),
      allowNull: false,
      defaultValue: 'draft',
    },
    unitCostPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalCostPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    isPaidToLab: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    dentistRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    dentistFeedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    digitalScanFileUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    shadePhotoUrls: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    clinicalNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
    },
  },
  {
    timestamps: true,
    tableName: 'LabOrders',
  }
);

export default LabOrder;
