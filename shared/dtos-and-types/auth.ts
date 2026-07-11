import type {
  ActiveBundleLock,
  ActiveIndividualTestLock,
  ActiveLock,
} from './bundle';

export interface RegisterProfile {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  phoneNumber?: string | null;
  birthDate?: string | Date | null;
  jobTitle?: string | null;
  company?: string | null;
  experienceYears?: number | null;
}

export type UpdateProfile = Partial<RegisterProfile>;

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  phoneNumber?: string | null;
  birthDate?: string | Date | null;
  jobTitle?: string | null;
  company?: string | null;
  experienceYears?: number | null;
  totalCpeHours?: number;
  totalMoneyPaid?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  activeBundle?: ActiveBundleLock | null;
  activeIndividualTest?: ActiveIndividualTestLock | null;
  activeLock?: ActiveLock | null;
}

export interface LoginResponse {
  success: boolean;
  user?: AuthUser;
}

export interface RegisterResponse {
  success: boolean;
}

export interface LogoutResponse {
  success: boolean;
}

export interface ChangePasswordResponse {
  success: boolean;
  message?: string;
}

export interface CancelActiveLockResponse {
  success: boolean;
  type: 'bundle' | 'individual';
}
