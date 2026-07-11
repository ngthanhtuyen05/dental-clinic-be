import PatientProfile from '../models/patientProfileModel.js';
import User from '../models/userModel.js';
import type { PatientProfileModel } from '../models/patientProfileModel.js';
import type { CreationAttributes, Transaction } from 'sequelize';

export class PatientProfileRepository {
  async findByUserId(userId: number): Promise<PatientProfileModel | null> {
    return PatientProfile.findOne({
      where: { userId },
      include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }],
    });
  }

  async findById(id: number): Promise<PatientProfileModel | null> {
    return PatientProfile.findByPk(id);
  }

  async create(data: CreationAttributes<PatientProfileModel>, transaction?: Transaction): Promise<PatientProfileModel> {
    return PatientProfile.create(data, { transaction });
  }

  async update(profile: PatientProfileModel, data: Partial<PatientProfileModel>): Promise<PatientProfileModel> {
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        (profile as any)[key] = value;
      }
    }
    await profile.save();
    return profile;
  }
}

export const patientProfileRepository = new PatientProfileRepository();
