import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/db.js';

export interface UsageGuideModel extends Model<InferAttributes<UsageGuideModel>, InferCreationAttributes<UsageGuideModel>> {
  id: CreationOptional<number>;
  title: string;
  category: string;
  content: string;
  isActive: CreationOptional<boolean>;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
}

const UsageGuide = sequelize.define<UsageGuideModel>('UsageGuide', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  timestamps: true,
});

export default UsageGuide;
