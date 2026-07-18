import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/db.js';
import { ServiceUnit } from '../constants/enums.js';

export interface ServiceModel extends Model<InferAttributes<ServiceModel>, InferCreationAttributes<ServiceModel>> {
  id: CreationOptional<number>;
  categoryId: number;
  code: CreationOptional<string>;
  name: string;
  description: CreationOptional<string | null>;
  price: number;
  unit: CreationOptional<ServiceUnit>;
  durationMinutes: CreationOptional<number>;
  isActive: CreationOptional<boolean>;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
  // Association virtual field
  category?: any;
}

const Service = sequelize.define<ServiceModel>('Service', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ServiceCategories',
      key: 'id',
    },
    onDelete: 'RESTRICT',
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  unit: {
    type: DataTypes.ENUM(...Object.values(ServiceUnit)),
    allowNull: false,
    defaultValue: ServiceUnit.SESSION,
  },
  durationMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  timestamps: true,
});

export default Service;
