import { API_BASE_URL } from "./config";
import { toast } from "sonner";

export const testVariantsService = {
  async getTestVariants(params?: {
    page?: number;
    cert?: string;
  }): Promise<any> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append("page", params.page.toString());
      if (params?.cert) query.append("cert", params.cert);

      const queryString = query.toString();
      const url = `${API_BASE_URL}/test-variants${queryString ? `?${queryString}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) {
        toast.error("فشل في تحميل قائمة الاختبارات");
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
      toast.error(err?.message || "فشل في تحميل قائمة الاختبارات");
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

  async getTestVariantById(id: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/test-variants/${id}`);
      if (!response.ok) {
        toast.error("فشل في تحميل تفاصيل الاختبار");
        return null;
      }
      return await response.json();
    } catch (err: any) {
      toast.error(err?.message || "فشل في تحميل تفاصيل الاختبار");
      return null;
    }
  },

  async confirmBundle(variantIds: string[]): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/bundles/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ variantIds }),
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "فشل تأكيد الباقة");
        return null;
      }
      return data;
    } catch (err: any) {
      toast.error(err?.message || "فشل تأكيد الباقة");
      return null;
    }
  },

  async saveBundleProgress(
    testVariantId: string,
  ): Promise<{ success: boolean; allFinished: boolean } | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/bundles/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ testVariantId }),
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "فشل حفظ تقدم الباقة");
        return null;
      }
      return data;
    } catch (err: any) {
      toast.error(err?.message || "فشل حفظ تقدم الباقة");
      return null;
    }
  },

  // Individual Test Endpoints
  async finishIndividualTest(testVariantId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/individual-tests/finish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ testVariantId }),
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "فشل تسجيل اكتمال الاختبار");
        return null;
      }
      return data;
    } catch (err: any) {
      toast.error(err?.message || "فشل تسجيل اكتمال الاختبار");
      return null;
    }
  },
};
