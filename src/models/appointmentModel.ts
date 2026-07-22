import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/db.js';
import { AppointmentStatus, AppointmentType } from '../constants/enums.js';

export interface AppointmentModel extends Model<InferAttributes<AppointmentModel>, InferCreationAttributes<AppointmentModel>> {
  id: CreationOptional<number>;
  code: CreationOptional<string>;
  patientId: number;
  dentistId: number;
  serviceId: number;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: CreationOptional<AppointmentStatus>;
  type: AppointmentType;
  chiefComplaint: string | null;
  notes: string | null;
  cancelReason: string | null;
  checkedInAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  createdBy: number | null;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
}

const Appointment = sequelize.define<AppointmentModel>('Appointment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
  },
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  dentistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
    onDelete: 'RESTRICT',
  },
  serviceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Services',
      key: 'id',
    },
    onDelete: 'RESTRICT',
  },
  appointmentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  startTime: {
    type: DataTypes.STRING(10), // "09:00"
    allowNull: false,
  },
  endTime: {
    type: DataTypes.STRING(10), // "09:45"
    allowNull: false,
  },
  durationMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(AppointmentStatus)),
    defaultValue: AppointmentStatus.SCHEDULED,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM(...Object.values(AppointmentType)),
    allowNull: false,
    defaultValue: AppointmentType.REGULAR,
  },
  chiefComplaint: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cancelReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  checkedInAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  cancelledAt: {
    type: DataTypes.DATE,
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

export default Appointment;
