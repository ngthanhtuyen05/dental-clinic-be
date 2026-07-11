import { userRepository } from '../repositories/userRepository.js';
import { hashPassword } from '../utils/password.js';
import { CreateUserRequestDto, UpdateUserRequestDto } from '../dtos/userDto.js';
import AppError from '../utils/AppError.js';
import type { UserModel } from '../models/userModel.js';

export const getAllUsers = async (): Promise<UserModel[]> => {
  return await userRepository.findAll();
};

export const getUserById = async (id: number): Promise<UserModel | null> => {
  return await userRepository.findById(id);
};

export const createNewUser = async (userData: CreateUserRequestDto): Promise<UserModel> => {
  const { fullName, email, password, phone, role } = userData;

  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new AppError('Email is already registered', 400);
  }

  const hashedPassword = await hashPassword(password);

  return await userRepository.create({
    fullName,
    email,
    password: hashedPassword,
    phone,
    role,
  });
};

export const updateUser = async (id: number, updateData: UpdateUserRequestDto): Promise<UserModel | null> => {
  const user = await userRepository.findById(id, { includePassword: true });
  if (!user) return null;

  const data: UpdateUserRequestDto = { ...updateData };

  // Check email uniqueness if changed
  if (data.email && data.email !== user.email) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError('Email is already in use by another user', 400);
    }
  }

  // Hash password if provided
  if (data.password) {
    data.password = await hashPassword(data.password);
  }

  return await userRepository.update(user, data);
};

export const deleteUser = async (id: number): Promise<boolean> => {
  const user = await userRepository.findById(id);
  if (!user) return false;
  await userRepository.delete(user);
  return true;
};
