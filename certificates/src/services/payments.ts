import { API_BASE_URL } from "./config";
import type {
  PaymentRequestDto,
  PaymentResult,
} from "@shared/dtos-and-types";
import { toast } from "sonner";

export type { PaymentRequestDto, PaymentResult };

export const paymentsService = {
  async pay(paymentData?: PaymentRequestDto): Promise<PaymentResult | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData || {}),
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "فشلت عملية الدفع");
        return null;
      }
      return data;
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ أثناء معالجة الدفع");
      return null;
    }
  },
};
