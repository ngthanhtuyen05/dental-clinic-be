import type { UserModel } from '../models/userModel.js';
import type { CreationAttributes, Transaction } from 'sequelize';
import User from '../models/userModel.js';

export class UserRepository {
  async findAll(): Promise<UserModel[]> {
    return User.findAll({
      attributes: { exclude: ['password'] },
    });
  }

  async findById(id: number, options?: { includePassword?: boolean }): Promise<UserModel | null> {
    return User.findByPk(id, {
      attributes: options?.includePassword ? undefined : { exclude: ['password'] },
    });
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    return User.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<UserModel | null> {
    return User.findOne({ where: { phone } });
  }

  async create(data: CreationAttributes<UserModel>, transaction?: Transaction): Promise<UserModel> {
    return User.create(data, { transaction });
  }

  async update(user: UserModel, data: Partial<Pick<UserModel, 'fullName' | 'email' | 'password' | 'phone' | 'role'>>): Promise<UserModel> {
    if (data.fullName) user.fullName = data.fullName;
    if (data.email) user.email = data.email;
    if (data.password) user.password = data.password;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.role) user.role = data.role;
    await user.save();
    return user;
  }

  async delete(user: UserModel): Promise<void> {
    await user.destroy();
  }
}

export const userRepository = new UserRepository();
