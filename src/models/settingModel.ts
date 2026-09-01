import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/db.js';

export interface SettingModel extends Model<InferAttributes<SettingModel>, InferCreationAttributes<SettingModel>> {
  key: string;
  value: any;
  description: CreationOptional<string | null>;
  updatedBy: CreationOptional<number | null>;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
}

const Setting = sequelize.define<SettingModel>(
  'Setting',
  {
    key: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
    },
    value: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
    },
  },
  {
    timestamps: true,
    tableName: 'Settings',
  }
);

export default Setting;
