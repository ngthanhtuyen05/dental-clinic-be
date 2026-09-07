import { Invoice, PatientProfile, Appointment, TreatmentHistory, Prescription, User } from '../models/index.js';
import type { InvoiceModel } from '../models/invoiceModel.js';
import type { CreationAttributes, Transaction, WhereOptions } from 'sequelize';

export interface InvoiceFindAllOptions {
  where?: WhereOptions;
  limit?: number;
  offset?: number;
}

export class InvoiceRepository {
  async findById(id: number | string): Promise<InvoiceModel | null> {
    return Invoice.findByPk(id, {
      include: [
        {
          model: PatientProfile,
          as: 'patientProfile',
          include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'] }],
        },
        { model: Appointment, as: 'appointment' },
        { model: TreatmentHistory, as: 'treatmentHistory' },
        { model: Prescription, as: 'prescription' },
        { model: User, as: 'creator', attributes: ['id', 'fullName', 'email'] },
      ],
    });
  }

  async findRawById(id: number | string): Promise<InvoiceModel | null> {
    return Invoice.findByPk(id);
  }

  async findByCode(code: string): Promise<InvoiceModel | null> {
    return Invoice.findOne({ where: { code } });
  }

  async findAll(options: InvoiceFindAllOptions): Promise<InvoiceModel[]> {
    return Invoice.findAll({
      where: options.where,
      include: [
        {
          model: PatientProfile,
          as: 'patientProfile',
          include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'] }],
        },
        { model: Appointment, as: 'appointment' },
        { model: TreatmentHistory, as: 'treatmentHistory' },
        { model: Prescription, as: 'prescription' },
      ],
      order: [['createdAt', 'DESC']],
      limit: options.limit,
      offset: options.offset,
    });
  }

  async create(data: CreationAttributes<InvoiceModel>, transaction?: Transaction): Promise<InvoiceModel> {
    return Invoice.create(data, { transaction });
  }

  async update(
    invoice: InvoiceModel,
    data: Partial<InvoiceModel>,
    transaction?: Transaction
  ): Promise<InvoiceModel> {
    return invoice.update(data, { transaction });
  }
}

export const invoiceRepository = new InvoiceRepository();
