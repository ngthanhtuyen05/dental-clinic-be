import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/db.js';
import { InventoryCategory, ProductUnit } from '../constants/enums.js';

export interface ProductModel extends Model<InferAttributes<ProductModel>, InferCreationAttributes<ProductModel>> {
  id: CreationOptional<number>;
  code: string;
  name: string;
  category: InventoryCategory;
  unit: ProductUnit;
  supplierId: CreationOptional<number | null>;
  minStock: number;
  description: CreationOptional<string | null>;
  isActive: CreationOptional<boolean>;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
}

const Product = sequelize.define<ProductModel>('Product', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM(...Object.values(InventoryCategory)),
    allowNull: false,
  },
  unit: {
    type: DataTypes.ENUM(...Object.values(ProductUnit)),
    allowNull: false,
  },
  supplierId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Suppliers', key: 'id' },
  },
  minStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  timestamps: true,
});

export default Product;
