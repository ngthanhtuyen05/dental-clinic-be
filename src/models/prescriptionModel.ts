import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/db.js';
import { PrescriptionStatus } from '../constants/enums.js';

export interface PrescriptionModel extends Model<InferAttributes<PrescriptionModel>, InferCreationAttributes<PrescriptionModel>> {
  id: CreationOptional<number>;
  code: CreationOptional<string>;
  patientProfileId: number;
  dentistId: number;
  appointmentId?: CreationOptional<number | null>;
  treatmentHistoryId?: CreationOptional<number | null>;
  status: CreationOptional<PrescriptionStatus>;
  diagnosis: string;
  notes?: CreationOptional<string | null>;
  prescribedAt: CreationOptional<Date>;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
  // Associated models
  patientProfile?: any;
  patient?: any;
  dentist?: any;
  items?: any[];
}

const Prescription = sequelize.define<PrescriptionModel>('Prescription', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING(40),
    allowNull: false,
    unique: true,
  },
  patientProfileId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'PatientProfiles',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  dentistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
    onDelete: 'RESTRICT',
  },
  appointmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Appointments',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  treatmentHistoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'TreatmentHistories',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  status: {
    type: DataTypes.ENUM(...Object.values(PrescriptionStatus)),
    allowNull: false,
    defaultValue: PrescriptionStatus.CONFIRMED,
  },
  diagnosis: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  prescribedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: true,
});

export default Prescription;
