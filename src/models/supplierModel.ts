import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/db.js';

export interface SupplierModel extends Model<InferAttributes<SupplierModel>, InferCreationAttributes<SupplierModel>> {
  id: CreationOptional<number>;
  name: string;
  contactPerson: CreationOptional<string | null>;
  phone: string;
  email: CreationOptional<string | null>;
  address: CreationOptional<string | null>;
  isActive: CreationOptional<boolean>;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
}

const Supplier = sequelize.define<SupplierModel>('Supplier', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  contactPerson: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  timestamps: true,
});

export default Supplier;
