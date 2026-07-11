import { API_BASE_URL } from "./config";
import { RegisterProfile, UpdateProfile, ChangePasswordData } from "@shared/dtos-and-types/auth";

export const authService = {
  async getMe(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Invalid or expired session cookie");
    }
    return response.json();
  },

  async logout(): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to logout");
    }
    return response.json();
  },

  async login(credentialsData: any): Promise<{ success: boolean }> {
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
      throw new Error(data.message || "حدث خطأ أثناء تسجيل الدخول");
    }
    return data;
  },

  async register(data: RegisterProfile): Promise<{ success: boolean }> {
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
      throw new Error(responseData.message || "حدث خطأ أثناء إنشاء الحساب");
    }
    return responseData;
  },

  async updateProfile(data: UpdateProfile): Promise<any> {
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
      throw new Error(
        responseData.message || "حدث خطأ أثناء تحديث الملف الشخصي",
      );
    }
    return responseData;
  },

  async changePassword(data: ChangePasswordData): Promise<any> {
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
      throw new Error(
        responseData.message || "حدث خطأ أثناء تغيير كلمة المرور",
      );
    }
    return responseData;
  },
};
