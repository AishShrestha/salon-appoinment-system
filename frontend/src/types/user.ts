// User role enum matching backend
export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

// User entity
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Registration data
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

// Login data
export interface LoginData {
  email: string;
  password: string;
}

// Login response
export interface LoginResponse {
  accessToken: string;
  user: User;
}

// Email verification data
export interface VerifyEmailData {
  token: string;
}
