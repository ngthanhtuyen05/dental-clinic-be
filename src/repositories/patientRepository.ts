import User from '../models/userModel.js';
import PatientProfile from '../models/patientProfileModel.js';
import TreatmentHistory from '../models/treatmentHistoryModel.js';
import { Op, type WhereOptions } from 'sequelize';
import { UserRole } from '../constants/enums.js';

export class PatientRepository {
  async findAndCount(options: {
    where?: WhereOptions;
    limit: number;
    offset: number;
  }) {
    return User.findAndCountAll({
      where: { role: UserRole.PATIENT, ...options.where },
      attributes: { exclude: ['password'] },
      include: [
        {
          model: PatientProfile,
          as: 'patientProfile',
          include: [
            {
              model: TreatmentHistory,
              as: 'treatmentHistories',
              attributes: ['treatmentDate'],
            }
          ]
        }
      ],
      order: [['id', 'DESC']],
      limit: options.limit,
      offset: options.offset,
      distinct: true,
    });
  }

  async findById(id: number) {
    return User.findOne({
      where: { id, role: UserRole.PATIENT },
      attributes: { exclude: ['password'] },
      include: [
        {
          model: PatientProfile,
          as: 'patientProfile',
          include: [
            {
              model: TreatmentHistory,
              as: 'treatmentHistories',
              attributes: ['id', 'diagnosis', 'treatment', 'cost', 'treatmentDate', 'notes'],
              include: [
                {
                  model: User,
                  as: 'dentist',
                  attributes: ['id', 'fullName'],
                }
              ]
            }
          ]
        }
      ],
    });
  }

  buildSearchWhere(keyword?: string): WhereOptions | undefined {
    if (!keyword?.trim()) return undefined;
    const kw = `%${keyword.trim()}%`;
    return {
      [Op.or]: [
        { fullName: { [Op.like]: kw } },
        { email: { [Op.like]: kw } },
        { phone: { [Op.like]: kw } },
      ],
    } as any;
  }
}

export const patientRepository = new PatientRepository();
