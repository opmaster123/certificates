import { API_BASE_URL } from "./config";
import { Certificate } from "@shared/dtos-and-types/certificate";
import { toast } from "sonner";

export const certificatesService = {
  async getMyCertificates(params?: {
    page?: number;
    cert?: string;
  }): Promise<any> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append("page", params.page.toString());
      if (params?.cert) query.append("cert", params.cert);

      const queryString = query.toString();
      const url = `${API_BASE_URL}/certificates/my${queryString ? `?${queryString}` : ""}`;

      const response = await fetch(url, {
        credentials: "include",
      });
      if (!response.ok) {
        toast.error("فشل في تحميل الشهادات الخاصة بك");
        return {
          items: [],
          data: [],
          total: 0,
          page: 1,
          limit: 0,
          hasMore: false,
        };
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        return {
          items: data,
          data: data,
          total: data.length,
          page: 1,
          limit: data.length,
          hasMore: false,
        };
      }
      return data;
    } catch (err: any) {
      toast.error(err?.message || "فشل في تحميل الشهادات الخاصة بك");
      return {
        items: [],
        data: [],
        total: 0,
        page: 1,
        limit: 0,
        hasMore: false,
      };
    }
  },

  async getCertificateByIdentifier(identifier: string): Promise<Certificate | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/certificates/${identifier}`);
      if (!response.ok) {
        toast.error("الشهادة المطلوبة غير موجودة أو انتهت صلاحيتها");
        return null;
      }
      return await response.json();
    } catch (err: any) {
      toast.error(err?.message || "فشل في تحميل الشهادة");
      return null;
    }
  },

  async updateCertificateDates(
    id: string,
    dates: { startDate: string; endDate: string },
  ): Promise<Certificate | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/certificates/${id}/dates`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dates),
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "فشل تحديث تواريخ الشهادة");
        return null;
      }
      return data;
    } catch (err: any) {
      toast.error(err?.message || "فشل تحديث تواريخ الشهادة");
      return null;
    }
  },
};
