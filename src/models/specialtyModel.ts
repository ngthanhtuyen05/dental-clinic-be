import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/db.js';

export interface SpecialtyModel extends Model<InferAttributes<SpecialtyModel>, InferCreationAttributes<SpecialtyModel>> {
  id: CreationOptional<number>;
  name: string;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
}

const Specialty = sequelize.define<SpecialtyModel>('Specialty', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
}, {
  timestamps: true,
});

export default Specialty;
