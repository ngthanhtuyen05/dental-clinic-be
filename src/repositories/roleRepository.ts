import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import { Role } from '../models/index.js';

export class RoleRepository {
  async findAll(search?: string) {
    const where: any = {};
    if (search?.trim()) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search.trim()}%` } },
        { code: { [Op.like]: `%${search.trim()}%` } },
        { description: { [Op.like]: `%${search.trim()}%` } },
      ];
    }

    return Role.findAll({
      where,
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM Users AS u
              WHERE u.roleId = Role.id OR u.role = Role.code
            )`),
            'userCount',
          ],
        ],
      },
      order: [
        ['isSystem', 'DESC'],
        ['id', 'ASC'],
      ],
    });
  }

  async findByIdOrCode(idOrCode: string | number) {
    const isNum = !isNaN(Number(idOrCode)) && Number(idOrCode) > 0;
    const where = isNum
      ? { [Op.or]: [{ id: Number(idOrCode) }, { code: String(idOrCode) }] }
      : { code: String(idOrCode) };

    return Role.findOne({
      where,
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM Users AS u
              WHERE u.roleId = Role.id OR u.role = Role.code
            )`),
            'userCount',
          ],
        ],
      },
    });
  }

  async findByCode(code: string) {
    return Role.findOne({ where: { code } });
  }

  async create(data: {
    name: string;
    code: string;
    color?: string;
    description?: string | null;
    isSystem?: boolean;
    permissions?: string[];
  }) {
    return Role.create(data);
  }

  async update(id: number, data: Partial<{
    name: string;
    code: string;
    color: string;
    description: string | null;
    isSystem: boolean;
    permissions: string[];
  }>) {
    const role = await Role.findByPk(id);
    if (!role) return null;
    return role.update(data);
  }

  async delete(id: number) {
    const role = await Role.findByPk(id);
    if (!role) return false;
    await role.destroy();
    return true;
  }
}

export const roleRepository = new RoleRepository();
