import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/db.js';

export interface LabOrderHistoryModel extends Model<InferAttributes<LabOrderHistoryModel>, InferCreationAttributes<LabOrderHistoryModel>> {
  id: CreationOptional<number>;
  labOrderId: number;
  previousStatus: string;
  newStatus: string;
  performedBy: string;
  actionNotes: CreationOptional<string | null>;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
}

const LabOrderHistory = sequelize.define<LabOrderHistoryModel>(
  'LabOrderHistory',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    labOrderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'LabOrders', key: 'id' },
      onDelete: 'CASCADE',
    },
    previousStatus: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    newStatus: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    performedBy: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Hệ thống',
    },
    actionNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: 'LabOrderHistories',
  }
);

export default LabOrderHistory;
