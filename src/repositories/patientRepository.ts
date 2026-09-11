import User from '../models/userModel.js';
import PatientProfile from '../models/patientProfileModel.js';
import TreatmentHistory from '../models/treatmentHistoryModel.js';
import { Op, type WhereOptions } from 'sequelize';
import { PatientStatus, UserRole } from '../constants/enums.js';

export class PatientRepository {
  async findAndCount(options: {
    where?: WhereOptions;
    profileWhere?: WhereOptions;
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
          where: options.profileWhere || undefined,
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
    const trimmed = keyword.trim();
    const kw = `%${trimmed}%`;
    const cleanId = trimmed.replace(/^BN0*/i, '');
    const numId = parseInt(cleanId, 10);

    const orConditions: any[] = [
      { fullName: { [Op.like]: kw } },
      { email: { [Op.like]: kw } },
      { phone: { [Op.like]: kw } },
    ];

    if (!isNaN(numId) && numId > 0) {
      orConditions.push({ id: numId });
    }

    return {
      [Op.or]: orConditions,
    } as any;
  }

  buildStatusWhere(status?: string): WhereOptions | undefined {
    if (!status || !Object.values(PatientStatus).includes(status as PatientStatus)) return undefined;
    return { status } as any;
  }

  async getClinicMetrics() {
    const total = await User.count({ where: { role: UserRole.PATIENT } });
    const activeCount = await PatientProfile.count({ where: { status: PatientStatus.ACTIVE } });
    const inactiveCount = await PatientProfile.count({ where: { status: PatientStatus.INACTIVE } });

    // Recent visits in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let recentVisitCount = 0;
    try {
      recentVisitCount = await TreatmentHistory.count({
        where: {
          treatmentDate: {
            [Op.gte]: thirtyDaysAgo,
          },
        },
        distinct: true,
        col: 'patientProfileId',
      });
    } catch {
      recentVisitCount = 0;
    }

    return {
      total,
      activeCount,
      inactiveCount,
      recentVisitCount,
    };
  }
}

export const patientRepository = new PatientRepository();
