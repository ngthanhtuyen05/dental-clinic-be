import { UserModel } from '../models/userModel.js';
import { UserRole } from '../constants/enums.js';

// Auth DTOs
export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserModel;
}

export interface TokenPairDto {
  accessToken: string;
  refreshToken: string;
}

// Request DTOs
export interface CreateUserRequestDto {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

export interface UpdateUserRequestDto {
  fullName?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: UserRole;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface RegisterUserRequestDto {
  fullName: string;
  phone: string;
  email: string;
  password: string;
}

// Response DTO
export class UserResponseDto {
  public id: number;
  public fullName: string;
  public email: string;
  public phone: string | null;
  public role: string;
  public createdAt: Date;

  constructor(user: UserModel) {
    this.id = user.id;
    this.fullName = user.fullName;
    this.email = user.email;
    this.phone = user.phone;
    this.role = user.role;
    this.createdAt = user.createdAt || new Date();
  }

  static toList(users: UserModel[]): UserResponseDto[] {
    return users.map((user) => new UserResponseDto(user));
  }
}
