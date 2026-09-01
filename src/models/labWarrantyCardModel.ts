import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/db.js';

export interface LabWarrantyCardModel extends Model<InferAttributes<LabWarrantyCardModel>, InferCreationAttributes<LabWarrantyCardModel>> {
  id: CreationOptional<number>;
  cardCode: string;
  labOrderId: CreationOptional<number | null>;
  patientProfileId: number;
  teethList: string;
  prostheticName: string;
  materialBrand: string;
  warrantyYears: CreationOptional<number>;
  startDate: string;
  endDate: string;
  warrantyStatus: CreationOptional<string>;
  termsAndConditions: CreationOptional<string | null>;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
}

const LabWarrantyCard = sequelize.define<LabWarrantyCardModel>(
  'LabWarrantyCard',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    cardCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    labOrderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'LabOrders', key: 'id' },
      onDelete: 'SET NULL',
    },
    patientProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'PatientProfiles', key: 'id' },
    },
    teethList: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    prostheticName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    materialBrand: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Chính hãng',
    },
    warrantyYears: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    warrantyStatus: {
      type: DataTypes.ENUM('active', 'expired', 'voided'),
      allowNull: false,
      defaultValue: 'active',
    },
    termsAndConditions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: 'LabWarrantyCards',
  }
);

export default LabWarrantyCard;
