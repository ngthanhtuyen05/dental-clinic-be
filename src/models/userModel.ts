import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/db.js';
import { UserRole } from '../constants/enums.js';

export interface UserModel extends Model<InferAttributes<UserModel>, InferCreationAttributes<UserModel>> {
  id: CreationOptional<number>;
  fullName: string;
  email: string;
  password: string;
  phone: CreationOptional<string | null>;
  role: CreationOptional<UserRole>;
  roleId: CreationOptional<number | null>;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
}

const User = sequelize.define<UserModel>('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM(...Object.values(UserRole)),
    defaultValue: UserRole.PATIENT,
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Roles', key: 'id' },
  },
}, {
  timestamps: true,
});

export default User;
