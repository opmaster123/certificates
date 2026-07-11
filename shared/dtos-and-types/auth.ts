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



