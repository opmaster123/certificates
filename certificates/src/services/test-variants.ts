import { API_BASE_URL } from "./config";

export const testVariantsService = {
  async getTestVariants(params?: {
    page?: number;
    cert?: string;
  }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.cert) query.append("cert", params.cert);

    const queryString = query.toString();
    const url = `${API_BASE_URL}/test-variants${queryString ? `?${queryString}` : ""}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch test variants");
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
  },

  async getTestVariantById(id: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/test-variants/${id}`);
    if (!response.ok) {
      throw new Error("Failed to load variant details");
    }
    return response.json();
  },

  async confirmBundle(variantIds: string[]): Promise<any> {
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
      throw new Error(data.message || "Failed to confirm bundle");
    }
    return data;
  },

  async getActiveBundle(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/bundles/active`, {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to fetch active bundle");
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  },

  async saveBundleProgress(
    testVariantId: string,
  ): Promise<{ success: boolean; allFinished: boolean }> {
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
      throw new Error(data.message || "Failed to save bundle progress");
    }
    return data;
  },

  async cancelBundle(): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/bundles/cancel`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to cancel bundle");
    }
    return response.json();
  },

  // Individual Test Endpoints
  async finishIndividualTest(testVariantId: string): Promise<any> {
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
      throw new Error(
        data.message || "Failed to register individual test completion",
      );
    }
    return data;
  },

  async getActiveIndividualTest(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/individual-tests/active`, {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to fetch active individual test lock");
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  },

  async cancelIndividualTest(): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/individual-tests/cancel`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to cancel individual test lock");
    }
    return response.json();
  },
};
