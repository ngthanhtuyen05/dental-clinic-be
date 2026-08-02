import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/db.js';
import { InvoiceStatus, PaymentMethod } from '../constants/enums.js';

export interface InvoiceModel extends Model<InferAttributes<InvoiceModel>, InferCreationAttributes<InvoiceModel>> {
  id: CreationOptional<number>;
  code: CreationOptional<string>;
  patientProfileId: number;
  appointmentId?: CreationOptional<number | null>;
  treatmentHistoryId?: CreationOptional<number | null>;
  prescriptionId?: CreationOptional<number | null>;
  totalAmount: number;         // Nguyên giá ban đầu
  discountAmount: number;      // Số tiền giảm giá
  paymentMethod?: CreationOptional<PaymentMethod | null>;
  status: CreationOptional<InvoiceStatus>;
  paidAt?: CreationOptional<Date | null>;
  momoTransId?: CreationOptional<string | null>;
  notes?: CreationOptional<string | null>;
  createdBy?: CreationOptional<number | null>;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;

  // Associations
  patientProfile?: any;
  appointment?: any;
  treatmentHistory?: any;
  prescription?: any;
  creator?: any;
}

const Invoice = sequelize.define<InvoiceModel>('Invoice', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING(40),
    allowNull: false,
    unique: true,
  },
  patientProfileId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'PatientProfiles',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  appointmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Appointments',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  treatmentHistoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'TreatmentHistories',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  prescriptionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Prescriptions',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  discountAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  paymentMethod: {
    type: DataTypes.ENUM(...Object.values(PaymentMethod)),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(InvoiceStatus)),
    allowNull: false,
    defaultValue: InvoiceStatus.UNPAID,
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  momoTransId: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
}, {
  timestamps: true,
});

export default Invoice;
