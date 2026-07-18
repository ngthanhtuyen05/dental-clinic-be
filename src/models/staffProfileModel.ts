import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/db.js';
import { StaffStatus } from '../constants/enums.js';

export interface StaffProfileModel extends Model<InferAttributes<StaffProfileModel>, InferCreationAttributes<StaffProfileModel>> {
  id: CreationOptional<number>;
  userId: number;
  staffCode: string;
  specialty: CreationOptional<string | null>;
  hireDate: string;
  address: CreationOptional<string | null>;
  notes: CreationOptional<string | null>;
  staffStatus: CreationOptional<StaffStatus>;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
}

const StaffProfile = sequelize.define<StaffProfileModel>('StaffProfile', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: 'Users', key: 'id' },
  },
  staffCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  specialty: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  hireDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  staffStatus: {
    type: DataTypes.ENUM(...Object.values(StaffStatus)),
    defaultValue: StaffStatus.ACTIVE,
  },
}, {
  timestamps: true,
  tableName: 'StaffProfiles',
});

export default StaffProfile;
