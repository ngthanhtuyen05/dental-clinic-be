import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/db.js';
import { StockTransactionType } from '../constants/enums.js';

export interface StockTransactionModel extends Model<InferAttributes<StockTransactionModel>, InferCreationAttributes<StockTransactionModel>> {
  id: CreationOptional<number>;
  productId: number;
  batchId: CreationOptional<number | null>;
  type: StockTransactionType;
  quantity: number;
  performedBy: number;
  treatmentHistoryId: CreationOptional<number | null>;
  reason: CreationOptional<string | null>;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
}

const StockTransaction = sequelize.define<StockTransactionModel>('StockTransaction', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Products', key: 'id' },
  },
  batchId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'StockBatches', key: 'id' },
  },
  type: {
    type: DataTypes.ENUM(...Object.values(StockTransactionType)),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  performedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
  },
  treatmentHistoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  updatedAt: false,
});

export default StockTransaction;
