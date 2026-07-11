import { API_BASE_URL } from "./config";
import { Certificate } from "@shared/dtos-and-types/certificate";

export const certificatesService = {
  async getMyCertificates(params?: {
    page?: number;
    cert?: string;
  }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.cert) query.append("cert", params.cert);

    const queryString = query.toString();
    const url = `${API_BASE_URL}/certificates/my${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to fetch my certificates");
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

  async getCertificateByIdentifier(identifier: string): Promise<Certificate> {
    const response = await fetch(`${API_BASE_URL}/certificates/${identifier}`);
    if (!response.ok) {
      throw new Error("Failed to fetch certificate");
    }
    return response.json();
  },
};
