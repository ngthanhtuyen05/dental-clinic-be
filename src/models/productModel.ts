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
  sellingPrice: CreationOptional<number>;
  importUnit: CreationOptional<string | null>;
  conversionRate: CreationOptional<number>;
  description: CreationOptional<string | null>;
  /** Hoạt chất — dùng để đối chiếu với khai báo dị ứng trong hồ sơ bệnh nhân khi kê đơn. */
  activeIngredient: CreationOptional<string | null>;
  /** Chống chỉ định cho phụ nữ mang thai. */
  pregnancyContraindicated: CreationOptional<boolean>;
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
  sellingPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  importUnit: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: null,
  },
  conversionRate: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  activeIngredient: {
    type: DataTypes.STRING(200),
    allowNull: true,
    defaultValue: null,
  },
  pregnancyContraindicated: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
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
