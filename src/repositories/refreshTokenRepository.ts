import RefreshToken from '../models/refreshTokenModel.js';
import type { RefreshTokenModel } from '../models/refreshTokenModel.js';

export class RefreshTokenRepository {
  async findByTokenAndUserId(token: string, userId: number): Promise<RefreshTokenModel | null> {
    return RefreshToken.findOne({
      where: { token, userId },
    });
  }

  async create(data: { userId: number; token: string; expiresAt: Date }): Promise<RefreshTokenModel> {
    return RefreshToken.create(data);
  }

  async destroyByToken(token: string): Promise<number> {
    return RefreshToken.destroy({ where: { token } });
  }

  async destroyInstance(instance: RefreshTokenModel): Promise<void> {
    await instance.destroy();
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
