import { API_BASE_URL } from "./config";
import type {
  AuthUser,
  RegisterProfile,
  UpdateProfile,
  ChangePasswordData,
  LoginCredentials,
  LoginResponse,
  RegisterResponse,
  LogoutResponse,
  ChangePasswordResponse,
  CancelActiveLockResponse,
} from "@shared/dtos-and-types/auth";
import { toast } from "sonner";

export const authService = {
  async getMe(): Promise<AuthUser | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: "include",
      });
      if (!response.ok) {
        return null;
      }
      return (await response.json()) as AuthUser;
    } catch {
      return null;
    }
  },

  async logout(): Promise<LogoutResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        toast.error("فشل تسجيل الخروج");
        return { success: false };
      }
      return (await response.json()) as LogoutResponse;
    } catch (err: any) {
      toast.error(err?.message || "فشل تسجيل الخروج");
      return { success: false };
    }
  },

  async login(credentialsData: LoginCredentials): Promise<LoginResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentialsData),
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "حدث خطأ أثناء تسجيل الدخول");
        return null;
      }
      return data as LoginResponse;
    } catch (err: any) {
      toast.error(err?.message || "فشل الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت");
      return null;
    }
  },

  async register(data: RegisterProfile): Promise<RegisterResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const responseData = await response.json();
      if (!response.ok) {
        toast.error(responseData.message || "حدث خطأ أثناء إنشاء الحساب");
        return null;
      }
      return responseData as RegisterResponse;
    } catch (err: any) {
      toast.error(err?.message || "فشل الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت");
      return null;
    }
  },

  async updateProfile(data: UpdateProfile): Promise<AuthUser | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const responseData = await response.json();
      if (!response.ok) {
        toast.error(responseData.message || "حدث خطأ أثناء تحديث الملف الشخصي");
        return null;
      }
      return responseData as AuthUser;
    } catch (err: any) {
      toast.error(err?.message || "فشل الاتصال بالخادم");
      return null;
    }
  },

  async changePassword(data: ChangePasswordData): Promise<ChangePasswordResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const responseData = await response.json();
      if (!response.ok) {
        toast.error(responseData.message || "حدث خطأ أثناء تغيير كلمة المرور");
        return null;
      }
      return responseData as ChangePasswordResponse;
    } catch (err: any) {
      toast.error(err?.message || "فشل الاتصال بالخادم");
      return null;
    }
  },

  async cancelActive(): Promise<CancelActiveLockResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/active-lock`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "فشل إلغاء الحجز النشط");
        return null;
      }
      return data as CancelActiveLockResponse;
    } catch (err: any) {
      toast.error(err?.message || "فشل إلغاء الحجز النشط");
      return null;
    }
  },
};
