import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/db.js';

export interface StockBatchModel extends Model<InferAttributes<StockBatchModel>, InferCreationAttributes<StockBatchModel>> {
  id: CreationOptional<number>;
  productId: number;
  batchNumber: string;
  initialQty: number;
  currentQty: number;
  importPrice: number;
  manufacturingDate: CreationOptional<Date | null>;
  expiryDate: CreationOptional<Date | null>;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
}

const StockBatch = sequelize.define<StockBatchModel>('StockBatch', {
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
  batchNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  initialQty: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  currentQty: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  importPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  manufacturingDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  expiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
}, {
  timestamps: true,
});

export default StockBatch;
