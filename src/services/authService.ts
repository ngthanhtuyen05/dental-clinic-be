import { UserRole } from '../constants/enums.js';
import HttpStatus from '../constants/httpStatus.js';
import Messages from '../constants/messages.js';
import type { AuthResponseDto, LoginRequestDto, RegisterUserRequestDto, TokenPairDto } from '../dtos/userDto.js';
import { refreshTokenRepository } from '../repositories/refreshTokenRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { Role } from '../models/index.js';
import type { UserModel } from '../models/userModel.js';
import AppError from '../utils/AppError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, REFRESH_TOKEN_EXPIRY_DAYS } from '../utils/jwt.js';
import { comparePassword, hashPassword } from '../utils/password.js';

export const getUserPermissions = async (user: UserModel): Promise<string[]> => {
  let roleRecord = null;
  if (user.roleId) {
    roleRecord = await Role.findByPk(user.roleId);
  }
  if (!roleRecord && user.role) {
    roleRecord = await Role.findOne({ where: { code: user.role } });
  }

  if (roleRecord && Array.isArray(roleRecord.permissions)) {
    return roleRecord.permissions;
  }
  return [];
};

const createTokenPair = async (userId: number): Promise<TokenPairDto> => {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  await refreshTokenRepository.create({
    userId,
    token: refreshToken,
    expiresAt,
  });

  return { accessToken, refreshToken };
};

export const loginUser = async (credentials: LoginRequestDto): Promise<AuthResponseDto & { permissions: string[] }> => {
  const { email, password } = credentials;

  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new AppError(Messages.AUTH.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new AppError(Messages.AUTH.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);
  }

  const tokens = await createTokenPair(user.id);
  const permissions = await getUserPermissions(user);
  return { ...tokens, user, permissions };
};

export const refreshUserToken = async (token: string): Promise<TokenPairDto> => {
  try {
    const decoded = verifyRefreshToken(token);

    const storedToken = await refreshTokenRepository.findByTokenAndUserId(token, decoded.id);

    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) await refreshTokenRepository.destroyInstance(storedToken);
      throw new AppError(Messages.AUTH.SESSION_EXPIRED, HttpStatus.FORBIDDEN);
    }

    // Token Rotation: xóa cũ, tạo mới
    await refreshTokenRepository.destroyInstance(storedToken);
    return await createTokenPair(decoded.id);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(Messages.AUTH.SESSION_EXPIRED, HttpStatus.FORBIDDEN);
  }
};

export const registerUser = async (registerData: RegisterUserRequestDto): Promise<AuthResponseDto> => {
  const { fullName, email, password, phone } = registerData;

  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new AppError(Messages.AUTH.EMAIL_TAKEN, HttpStatus.BAD_REQUEST);
  }

  const hashedPassword = await hashPassword(password);

  const user = await userRepository.create({
    fullName,
    email,
    password: hashedPassword,
    phone,
    role: UserRole.PATIENT,
  });

  const tokens = await createTokenPair(user.id);
  return { ...tokens, user };
};

export const logoutUser = async (token: string): Promise<void> => {
  await refreshTokenRepository.destroyByToken(token);
};
