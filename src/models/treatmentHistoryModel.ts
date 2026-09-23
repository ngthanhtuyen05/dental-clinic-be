import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/db.js';

export interface TreatmentHistoryModel extends Model<InferAttributes<TreatmentHistoryModel>, InferCreationAttributes<TreatmentHistoryModel>> {
  id: CreationOptional<number>;
  patientProfileId: number;
  dentistId: number;
  /** Lịch hẹn đã sinh ra lần khám này (null với lần khám nhập tay / walk-in không qua lịch hẹn). */
  appointmentId: CreationOptional<number | null>;
  diagnosis: string;
  treatment: string;
  cost: number;
  /** Số lượng đơn vị đã điều trị thực tế (VD: số răng đã bọc sứ) — dùng để tính cost = Service.price × treatedQuantity. */
  treatedQuantity: CreationOptional<number>;
  treatmentDate: Date;
  notes: CreationOptional<string | null>;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
  patientProfile?: any;
  dentist?: any;
}

const TreatmentHistory = sequelize.define<TreatmentHistoryModel>('TreatmentHistory', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
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
    onDelete: 'CASCADE',
  },
  appointmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true,
    references: {
      model: 'Appointments',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  diagnosis: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  treatment: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  treatedQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  treatmentDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    {
      name: 'idx_treatments_date_dentist',
      fields: ['treatmentDate', 'dentistId'],
    },
    {
      name: 'idx_treatments_patient_date',
      fields: ['patientProfileId', 'treatmentDate'],
    },
  ],
});

export default TreatmentHistory;
