import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/db.js';

export interface TreatmentHistoryModel extends Model<InferAttributes<TreatmentHistoryModel>, InferCreationAttributes<TreatmentHistoryModel>> {
  id: CreationOptional<number>;
  patientProfileId: number;
  dentistId: number;
  diagnosis: string;
  treatment: string;
  cost: number;
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
});

export default TreatmentHistory;
