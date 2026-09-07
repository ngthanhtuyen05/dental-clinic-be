import { Op, col, type WhereOptions } from 'sequelize';
import sequelize from '../config/db.js';
import { User, StaffProfile, Specialty } from '../models/index.js';
import { UserRole } from '../constants/enums.js';

// Staff = Users with role in [admin, dentist, staff] (non-patient)
const STAFF_ROLES = [UserRole.ADMIN, UserRole.DENTIST, UserRole.STAFF];

export class StaffRepository {
  /**
   * Build WHERE conditions for staff search
   */
  buildSearchWhere(keyword?: string, role?: string, status?: string, specialtyId?: number, specialtySlug?: string): WhereOptions | undefined {
    const conditions: any[] = [];

    // Always filter to staff roles only (exclude patients)
    conditions.push({ role: { [Op.in]: STAFF_ROLES } });

    if (keyword?.trim()) {
      const kw = `%${keyword.trim()}%`;
      conditions.push({
        [Op.or]: [
          { fullName: { [Op.like]: kw } },
          { email: { [Op.like]: kw } },
          { phone: { [Op.like]: kw } },
          { '$staffProfile.staffCode$': { [Op.like]: kw } },
        ],
      });
    }

    if (role) {
      conditions.push({ role });
    }

    if (status) {
      conditions.push({ '$staffProfile.staffStatus$': status });
    }

    if (specialtyId) {
      conditions.push({ '$staffProfile.specialtyId$': specialtyId });
    }

    if (specialtySlug) {
      conditions.push({ '$staffProfile.specialtyInfo.slug$': specialtySlug });
    }

    return { [Op.and]: conditions } as any;
  }

  /**
   * Get paginated list with StaffProfile eager-loaded
   */
  async findAndCount(options: { where?: WhereOptions; limit: number; offset: number }) {
    return User.findAndCountAll({
      where: options.where,
      include: [
        {
          model: StaffProfile,
          as: 'staffProfile',
          required: false,
          include: [
            {
              model: Specialty,
              as: 'specialtyInfo',
              required: false,
            },
          ],
        },
      ],
      order: [[col('User.id'), 'DESC']],
      limit: options.limit,
      offset: options.offset,
      distinct: true,
      attributes: { exclude: ['password'] },
      subQuery: false,
    });
  }

  /**
   * Find single staff member by id
   */
  async findById(id: number) {
    return User.findByPk(id, {
      include: [
        {
          model: StaffProfile,
          as: 'staffProfile',
          required: false,
          include: [
            {
              model: Specialty,
              as: 'specialtyInfo',
              required: false,
            },
          ],
        },
      ],
      attributes: { exclude: ['password'] },
    });
  }

  /**
   * Create user + staff profile in one atomic transaction
   */
  async createWithProfile(userData: any, profileData: any) {
    const createdUserId = await sequelize.transaction(async (t) => {
      const user = await User.create(userData, { transaction: t });
      await StaffProfile.create({
        ...profileData,
        userId: user.id,
      }, { transaction: t });
      return user.id;
    });

    // Reload with association
    return this.findById(createdUserId);
  }

  /**
   * Update user + staff profile in one transaction
   */
  async updateWithProfile(id: number, userData: any, profileData: any) {
    const user = await User.findByPk(id);
    if (!user) return null;

    await sequelize.transaction(async (t) => {
      // Update user fields
      if (Object.keys(userData).length > 0) {
        await user.update(userData, { transaction: t });
      }

      // Update profile fields
      if (Object.keys(profileData).length > 0) {
        let profile = await StaffProfile.findOne({ where: { userId: id }, transaction: t });
        if (profile) {
          await profile.update(profileData, { transaction: t });
        } else {
          await StaffProfile.create({ ...profileData, userId: id }, { transaction: t });
        }
      }
    });

    return this.findById(id);
  }

  /**
   * Get next staff code: NV-001, NV-002, ...
   */
  async getNextCode(): Promise<string> {
    const last = await StaffProfile.findOne({ order: [['id', 'DESC']] });
    const nextNum = last ? last.id + 1 : 1;
    return `NV-${String(nextNum).padStart(3, '0')}`;
  }

  /**
   * Count staff by role (for sidebar stats)
   */
  async countByRole(): Promise<Record<string, number>> {
    const allStaff = await User.findAll({
      where: { role: { [Op.in]: STAFF_ROLES } },
      attributes: ['role'],
      include: [{ model: StaffProfile, as: 'staffProfile', attributes: ['staffStatus'] }],
    });

    const result: Record<string, number> = { all: allStaff.length };
    for (const role of STAFF_ROLES) {
      result[role] = allStaff.filter((u: any) => u.role === role).length;
    }
    return result;
  }
}

export const staffRepository = new StaffRepository();
