import { Op, col, type WhereOptions } from 'sequelize';
import { User, StaffProfile, Specialty } from '../models/index.js';
import { UserRole } from '../constants/enums.js';

// Staff = Users with role in [admin, dentist, staff] (non-patient)
const STAFF_ROLES = [UserRole.ADMIN, UserRole.DENTIST, UserRole.STAFF];

export class StaffRepository {
  /**
   * Build WHERE conditions for staff search
   */
  buildSearchWhere(keyword?: string, role?: string, status?: string, specialtyId?: number): WhereOptions | undefined {
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
   * Create user + staff profile in one transaction
   */
  async createWithProfile(userData: any, profileData: any) {
    const user = await User.create(userData);
    const profile = await StaffProfile.create({
      ...profileData,
      userId: user.id,
    });
    // Reload with association
    return this.findById(user.id);
  }

  /**
   * Update user + staff profile
   */
  async updateWithProfile(id: number, userData: any, profileData: any) {
    const user = await User.findByPk(id);
    if (!user) return null;

    // Update user fields
    if (Object.keys(userData).length > 0) {
      await user.update(userData);
    }

    // Update profile fields
    if (Object.keys(profileData).length > 0) {
      let profile = await StaffProfile.findOne({ where: { userId: id } });
      if (profile) {
        await profile.update(profileData);
      } else {
        await StaffProfile.create({ ...profileData, userId: id });
      }
    }

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
