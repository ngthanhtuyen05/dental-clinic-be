import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/db.js';

export interface RoleModel extends Model<InferAttributes<RoleModel>, InferCreationAttributes<RoleModel>> {
  id: CreationOptional<number>;
  name: string;
  code: string;
  color: CreationOptional<string>;
  description: CreationOptional<string | null>;
  isSystem: CreationOptional<boolean>;
  permissions: CreationOptional<string[]>;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
}

const Role = sequelize.define<RoleModel>('Role', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  color: {
    type: DataTypes.STRING(30),
    defaultValue: 'blue',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isSystem: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
}, {
  timestamps: true,
  tableName: 'Roles',
});

export default Role;
