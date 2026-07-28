import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/db.js';
import { DosageFrequency, MealRelation } from '../constants/enums.js';

export interface DosageTemplateModel extends Model<InferAttributes<DosageTemplateModel>, InferCreationAttributes<DosageTemplateModel>> {
  id: CreationOptional<number>;
  name: string;
  frequency: DosageFrequency;
  quantityPerDose: number;
  durationDays: number;
  mealRelation: MealRelation;
  instruction: string;
  isActive: CreationOptional<boolean>;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
}

const DosageTemplate = sequelize.define<DosageTemplateModel>('DosageTemplate', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  frequency: {
    type: DataTypes.ENUM(...Object.values(DosageFrequency)),
    allowNull: false,
  },
  quantityPerDose: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  durationDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
  },
  mealRelation: {
    type: DataTypes.ENUM(...Object.values(MealRelation)),
    allowNull: false,
    defaultValue: MealRelation.AFTER_MEAL,
  },
  instruction: {
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

export default DosageTemplate;
