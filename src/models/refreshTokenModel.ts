import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/db.js';

export interface RefreshTokenModel extends Model<InferAttributes<RefreshTokenModel>, InferCreationAttributes<RefreshTokenModel>> {
  id: CreationOptional<number>;
  userId: number;
  token: string;
  expiresAt: Date;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
}

const RefreshToken = sequelize.define<RefreshTokenModel>('RefreshToken', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  token: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  timestamps: true,
});

export default RefreshToken;
