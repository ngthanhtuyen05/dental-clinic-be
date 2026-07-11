import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import sequelize from '../config/db.js';
import { AppointmentStatus } from '../constants/enums.js';

export interface AppointmentModel extends Model<InferAttributes<AppointmentModel>, InferCreationAttributes<AppointmentModel>> {
  id: CreationOptional<number>;
  appointmentDate: Date;
  status: CreationOptional<AppointmentStatus>;
  notes: string | null;
  patientId: number;
  dentistId: number;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
}

const Appointment = sequelize.define<AppointmentModel>('Appointment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  appointmentDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(AppointmentStatus)),
    defaultValue: AppointmentStatus.PENDING,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  dentistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  timestamps: true,
});

export default Appointment;
