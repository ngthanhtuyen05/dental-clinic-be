import Appointment from '../models/appointmentModel.js';
import User from '../models/userModel.js';
import Service from '../models/serviceModel.js';
import { Prescription, PrescriptionItem, Product, StockBatch } from '../models/index.js';
import type { AppointmentModel } from '../models/appointmentModel.js';
import { Op, type WhereOptions, type CreationAttributes, type Transaction } from 'sequelize';

export class AppointmentRepository {
  async findAndCount(options: {
    where: WhereOptions;
    limit: number;
    offset: number;
  }) {
    return Appointment.findAndCountAll({
      where: options.where,
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'fullName', 'email', 'phone'],
        },
        {
          model: User,
          as: 'dentist',
          attributes: ['id', 'fullName', 'email'],
        },
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name', 'price', 'durationMinutes', 'unit'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName'],
        },
      ],
      order: [
        ['appointmentDate', 'ASC'],
        ['startTime', 'ASC'],
      ],
      limit: options.limit,
      offset: options.offset,
      distinct: true,
    });
  }

  async findById(id: number): Promise<AppointmentModel | null> {
    return Appointment.findByPk(id, {
      include: [
        { model: User, as: 'patient', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: User, as: 'dentist', attributes: ['id', 'fullName', 'email'] },
        { model: Service, as: 'service', attributes: ['id', 'name', 'price', 'durationMinutes', 'unit'] },
        { model: User, as: 'creator', attributes: ['id', 'fullName'] },
        {
          model: Prescription,
          as: 'prescriptions',
          include: [
            {
              model: PrescriptionItem,
              as: 'items',
              include: [
                {
                  model: Product,
                  as: 'product',
                  attributes: ['id', 'code', 'name', 'unit', 'sellingPrice'],
                  include: [
                    {
                      model: StockBatch,
                      as: 'batches',
                      attributes: ['importPrice', 'currentQty'],
                      required: false,
                    },
                  ],
                },
              ],
            },
            {
              model: User,
              as: 'dentist',
              attributes: ['id', 'fullName', 'email'],
            },
          ],
          required: false,
        },
      ],
      order: [
        [{ model: Prescription, as: 'prescriptions' }, 'createdAt', 'DESC'],
      ],
    });
  }

  async create(data: CreationAttributes<AppointmentModel>, options?: { transaction?: Transaction }): Promise<AppointmentModel> {
    return Appointment.create(data, options);
  }

  async update(
    appointment: AppointmentModel,
    data: Partial<AppointmentModel>,
    options?: { transaction?: Transaction },
  ): Promise<AppointmentModel> {
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        (appointment as any)[key] = value;
      }
    }
    await appointment.save(options);
    return appointment;
  }

  async delete(appointment: AppointmentModel): Promise<void> {
    await appointment.destroy();
  }

  async countByStatus(where: WhereOptions): Promise<number> {
    return Appointment.count({ where });
  }

  /**
   * @param transaction Truyền vào để kiểm tra trùng lịch NGAY TRONG transaction tạo/đổi lịch
   *   hẹn, kèm khóa dòng — nếu đọc ngoài transaction thì đây là check-then-act kinh điển:
   *   hai yêu cầu đặt cùng khung giờ cùng lúc đều thấy "trống" rồi cùng ghi.
   */
  async findConflicting(dentistId: number, date: string, startTime: string, endTime: string, excludeId?: number, transaction?: Transaction): Promise<AppointmentModel[]> {
    const where: WhereOptions = {
      dentistId,
      appointmentDate: date,
      status: {
        [Op.notIn]: ['cancelled', 'no_show'],
      },
      [Op.or]: [
        {
          startTime: {
            [Op.lt]: endTime,
          },
          endTime: {
            [Op.gt]: startTime,
          },
        },
      ],
    };

    if (excludeId) {
      where.id = {
        [Op.ne]: excludeId,
      };
    }

    return Appointment.findAll({
      where,
      ...(transaction ? { transaction, lock: transaction.LOCK.UPDATE } : {}),
    });
  }

  async getLastCodeNumberForDate(dateStr: string): Promise<number> {
    // Tìm mã lớn nhất trong ngày để tăng số thứ tự
    const prefix = `APT-${dateStr.replace(/-/g, '')}-`;
    const lastAppt = await Appointment.findOne({
      where: {
        code: {
          [Op.like]: `${prefix}%`,
        },
      },
      order: [['code', 'DESC']],
    });

    if (!lastAppt) return 0;
    const parts = lastAppt.code.split('-');
    const num = parseInt(parts[parts.length - 1], 10);
    return isNaN(num) ? 0 : num;
  }
}

export const appointmentRepository = new AppointmentRepository();
