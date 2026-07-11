import Appointment from '../models/appointmentModel.js';
import User from '../models/userModel.js';
import type { AppointmentModel } from '../models/appointmentModel.js';
import type { CreationAttributes } from 'sequelize';

export class AppointmentRepository {
  async findAll(): Promise<AppointmentModel[]> {
    return Appointment.findAll({
      include: [
        { model: User, as: 'patient', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: User, as: 'dentist', attributes: ['id', 'fullName', 'email'] },
      ],
      order: [['appointmentDate', 'DESC']],
    });
  }

  async findById(id: number): Promise<AppointmentModel | null> {
    return Appointment.findByPk(id, {
      include: [
        { model: User, as: 'patient', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: User, as: 'dentist', attributes: ['id', 'fullName', 'email'] },
      ],
    });
  }

  async create(data: CreationAttributes<AppointmentModel>): Promise<AppointmentModel> {
    return Appointment.create(data);
  }

  async update(appointment: AppointmentModel, data: Partial<AppointmentModel>): Promise<AppointmentModel> {
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        (appointment as any)[key] = value;
      }
    }
    await appointment.save();
    return appointment;
  }

  async delete(appointment: AppointmentModel): Promise<void> {
    await appointment.destroy();
  }
}

export const appointmentRepository = new AppointmentRepository();
