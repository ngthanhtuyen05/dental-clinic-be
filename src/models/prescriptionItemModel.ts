import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/db.js';
import { DosageFrequency, MealRelation } from '../constants/enums.js';

export interface PrescriptionItemModel extends Model<InferAttributes<PrescriptionItemModel>, InferCreationAttributes<PrescriptionItemModel>> {
  id: CreationOptional<number>;
  prescriptionId: number;
  productId: number;
  dosageTemplateId?: CreationOptional<number | null>;
  dosageText: string;
  quantityPerDose: number;
  frequency: DosageFrequency;
  durationDays: number;
  totalQuantity: number;
  mealRelation: MealRelation;
  usageInstruction?: CreationOptional<string | null>;
  warnings?: CreationOptional<string | null>;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
  product?: any;
}

const PrescriptionItem = sequelize.define<PrescriptionItemModel>('PrescriptionItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  prescriptionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Prescriptions',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Products',
      key: 'id',
    },
    onDelete: 'RESTRICT',
  },
  dosageTemplateId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  dosageText: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  quantityPerDose: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  frequency: {
    type: DataTypes.ENUM(...Object.values(DosageFrequency)),
    allowNull: false,
  },
  durationDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
  },
  totalQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  mealRelation: {
    type: DataTypes.ENUM(...Object.values(MealRelation)),
    allowNull: false,
    defaultValue: MealRelation.AFTER_MEAL,
  },
  usageInstruction: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  warnings: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
});

export default PrescriptionItem;
