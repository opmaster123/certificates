import { API_BASE_URL } from "./config";
import type {
  PaymentResult,
  CreateIntentionResponseDto,
  ConfirmPaymentDto,
} from "@shared/dtos-and-types";
import { toast } from "sonner";

export type { PaymentResult, CreateIntentionResponseDto, ConfirmPaymentDto };

export const paymentsService = {
  /**
   * Request a Paymob Intention (client_secret) for the active test/bundle
   */
  async createIntention(): Promise<CreateIntentionResponseDto | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/intention`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "تعذر بدء عملية الدفع عبر Paymob");
        return null;
      }
      return data;
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ أثناء الاتصال ببوابة الدفع");
      return null;
    }
  },

  /**
   * Confirm payment after Pixel checkout completes
   */
  async confirm(dto: ConfirmPaymentDto): Promise<PaymentResult | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dto),
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "فشل تأكيد عملية الدفع");
        return null;
      }
      return data;
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ أثناء تأكيد الدفع");
      return null;
    }
  },
};
