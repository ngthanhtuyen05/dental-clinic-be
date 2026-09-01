import { Setting, User } from '../models/index.js';
import type { SettingModel } from '../models/settingModel.js';

export class SettingRepository {
  async findAll(): Promise<SettingModel[]> {
    return Setting.findAll({
      include: [
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'fullName', 'email'],
        },
      ],
      order: [['key', 'ASC']],
    });
  }

  async findByKey(key: string): Promise<SettingModel | null> {
    return Setting.findByPk(key, {
      include: [
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'fullName', 'email'],
        },
      ],
    });
  }

  async upsert(
    key: string,
    value: any,
    description?: string | null,
    updatedBy?: number | null
  ): Promise<SettingModel> {
    const existing = await Setting.findByPk(key);
    if (existing) {
      existing.value = value;
      if (description !== undefined) {
        existing.description = description;
      }
      if (updatedBy !== undefined) {
        existing.updatedBy = updatedBy;
      }
      await existing.save();
      return existing;
    }

    return Setting.create({
      key,
      value,
      description: description || null,
      updatedBy: updatedBy || null,
    });
  }

  async delete(key: string): Promise<boolean> {
    const setting = await Setting.findByPk(key);
    if (!setting) return false;
    await setting.destroy();
    return true;
  }
}

export const settingRepository = new SettingRepository();
