import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/db.js';
import { StaffStatus } from '../constants/enums.js';

export interface StaffProfileModel extends Model<InferAttributes<StaffProfileModel>, InferCreationAttributes<StaffProfileModel>> {
  id: CreationOptional<number>;
  userId: number;
  staffCode: string;
  specialty: CreationOptional<string | null>;
  specialtyId: CreationOptional<number | null>;
  hireDate: string;
  gender: CreationOptional<string | null>;
  dateOfBirth: CreationOptional<string | null>;
  address: CreationOptional<string | null>;
  notes: CreationOptional<string | null>;
  staffStatus: CreationOptional<StaffStatus>;
  // Bác sĩ / Doctor fields
  academicTitle: CreationOptional<string | null>;
  licenseNumber: CreationOptional<string | null>;
  licenseDate: CreationOptional<string | null>;
  experienceYears: CreationOptional<number | null>;
  avatar: CreationOptional<string | null>;
  badge: CreationOptional<string | null>;
  bio: CreationOptional<string | null>;
  quote: CreationOptional<string | null>;
  education: CreationOptional<any[] | null>;
  certificates: CreationOptional<any[] | null>;
  achievements: CreationOptional<any[] | null>;
  workingSchedule: CreationOptional<string | null>;
  slotDuration: CreationOptional<number | null>;
  subSpecialties: CreationOptional<string[] | null>;
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
  specialtyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Specialties', key: 'id' },
  },
  hireDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  gender: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
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
  academicTitle: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  licenseNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  licenseDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  experienceYears: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  avatar: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  badge: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  quote: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  education: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  certificates: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  achievements: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  workingSchedule: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  slotDuration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 30,
  },
  subSpecialties: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'StaffProfiles',
});

export default StaffProfile;
