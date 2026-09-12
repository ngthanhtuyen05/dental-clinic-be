import TreatmentHistory from '../models/treatmentHistoryModel.js';
import PatientProfile from '../models/patientProfileModel.js';
import User from '../models/userModel.js';
import type { TreatmentHistoryModel } from '../models/treatmentHistoryModel.js';
import type { CreationAttributes } from 'sequelize';
import { Prescription, PrescriptionItem, Product } from './../models/index.js';

export class TreatmentHistoryRepository {
  async findByProfileId(patientProfileId: number): Promise<TreatmentHistoryModel[]> {
    return TreatmentHistory.findAll({
      where: { patientProfileId },
      include: [
        { model: User, as: 'dentist', attributes: ['id', 'fullName'] },
        {
          model: Prescription,
          as: 'prescriptions',
          required: false,
          attributes: ['id', 'code', 'status', 'diagnosis', 'prescribedAt'],
          include: [
            {
              model: PrescriptionItem,
              as: 'items',
              attributes: ['id', 'dosageText', 'totalQuantity', 'frequency', 'durationDays'],
              include: [
                { model: Product, as: 'product', attributes: ['id', 'code', 'name', 'unit'] },
              ],
            },
          ],
        },
      ],
      order: [['treatmentDate', 'DESC']],
    });
  }

  async findById(id: number): Promise<TreatmentHistoryModel | null> {
    return TreatmentHistory.findByPk(id, {
      include: [
        { model: PatientProfile, as: 'patientProfile' },
        { model: User, as: 'dentist', attributes: ['id', 'fullName'] },
        {
          model: Prescription,
          as: 'prescriptions',
          required: false,
          attributes: ['id', 'code', 'status', 'diagnosis', 'prescribedAt'],
          include: [
            {
              model: PrescriptionItem,
              as: 'items',
              attributes: ['id', 'dosageText', 'totalQuantity', 'frequency', 'durationDays'],
              include: [
                { model: Product, as: 'product', attributes: ['id', 'code', 'name', 'unit'] },
              ],
            },
          ],
        },
      ],
    });
  }

  async create(data: CreationAttributes<TreatmentHistoryModel>): Promise<TreatmentHistoryModel> {
    return TreatmentHistory.create(data);
  }

  async update(record: TreatmentHistoryModel, data: Partial<TreatmentHistoryModel>): Promise<TreatmentHistoryModel> {
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        (record as any)[key] = value;
      }
    }
    await record.save();
    return record;
  }

  async delete(record: TreatmentHistoryModel): Promise<void> {
    await record.destroy();
  }
}

export const treatmentHistoryRepository = new TreatmentHistoryRepository();
