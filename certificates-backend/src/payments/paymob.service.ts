import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

export interface PaymobBillingData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  apartment?: string;
  floor?: string;
  street?: string;
  building?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  state?: string;
}

export interface PaymobItemDto {
  name: string;
  amount: number;
  description: string;
  quantity: number;
}

export interface CreateIntentionOptions {
  userId: string;
  amount: number;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string | null;
  };
  title?: string;
  items?: PaymobItemDto[];
}

@Injectable()
export class PaymobService {
  private readonly logger = new Logger(PaymobService.name);

  private readonly baseUrl: string;
  private readonly secretKey: string;
  private readonly publicKey: string;
  private readonly hmacSecret: string;
  private readonly integrationId: number;
  private readonly currency: string;
  private readonly frontendUrl: string;

  constructor() {
    const baseUrl = process.env.PAYMOB_BASE_URL;
    const secretKey = process.env.PAYMOB_SECRET_KEY;
    const publicKey = process.env.PAYMOB_PUBLIC_KEY;
    const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
    const integrationIdStr = process.env.PAYMOB_INTEGRATION_ID;
    const currency = process.env.PAYMOB_CURRENCY;
    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.COOLIFY_URL ||
      (process.env.COOLIFY_FQDN ? `https://${process.env.COOLIFY_FQDN}` : '') ||
      (process.env.NODE_ENV === 'production' ? 'https://certificates.khutta.app' : 'http://localhost:8080');

    if (!baseUrl) {
      throw new Error('PAYMOB_BASE_URL environment variable is required and missing.');
    }
    if (!secretKey) {
      throw new Error('PAYMOB_SECRET_KEY environment variable is required and missing.');
    }
    if (!publicKey) {
      throw new Error('PAYMOB_PUBLIC_KEY environment variable is required and missing.');
    }
    if (!hmacSecret) {
      throw new Error('PAYMOB_HMAC_SECRET environment variable is required and missing.');
    }
    if (!integrationIdStr || isNaN(Number(integrationIdStr))) {
      throw new Error('PAYMOB_INTEGRATION_ID environment variable is required and must be a valid number.');
    }
    if (!currency) {
      throw new Error('PAYMOB_CURRENCY environment variable is required and missing.');
    }

    this.baseUrl = baseUrl;
    this.secretKey = secretKey;
    this.publicKey = publicKey;
    this.hmacSecret = hmacSecret;
    this.integrationId = Number(integrationIdStr);
    this.currency = currency;
    this.frontendUrl = frontendUrl;
  }

  /**
   * Creates a Paymob Intention for Pixel / Unified checkout
   */
  async createIntention(options: CreateIntentionOptions) {
    const { userId, amount, user, title } = options;
    const amountInCents = Math.round(amount * 100);

    const firstName = user.firstName?.trim() || 'User';
    const lastName = user.lastName?.trim() || 'Customer';
    const email = user.email?.trim() || 'customer@example.com';
    const phoneNumber = user.phoneNumber?.trim() || '+201000000000';
    const itemTitle = title?.trim() || 'شهادات معتمدة';

    const specialReference = `USER_${userId}_${Date.now()}`;
    const redirectionUrl = `${this.frontendUrl}/certificates`;

    const intentionItems =
      options.items && options.items.length > 0
        ? options.items
        : [
            {
              name: itemTitle,
              amount: amountInCents,
              description: itemTitle,
              quantity: 1,
            },
          ];

    const payload = {
      amount: amountInCents,
      currency: this.currency,
      payment_methods: [this.integrationId],
      redirection_url: redirectionUrl,
      items: intentionItems,
      billing_data: {
        apartment: 'NA',
        first_name: firstName,
        last_name: lastName,
        street: 'NA',
        building: 'NA',
        phone_number: phoneNumber,
        city: 'Cairo',
        country: 'EG',
        email: email,
        floor: 'NA',
        state: 'Cairo',
      },
      customer: {
        first_name: firstName,
        last_name: lastName,
        email: email,
        extras: {
          userId,
        },
      },
      extras: {
        userId,
      },
      special_reference: specialReference,
    };

    if (process.env.PAYMOB_WEBHOOK_URL) {
      (payload as any).notification_url = process.env.PAYMOB_WEBHOOK_URL;
    }

    try {
      this.logger.log(
        `Creating Paymob Intention for userId: ${userId}, amount: ${amount} ${this.currency}`,
      );

      const response = await axios.post(
        `${this.baseUrl}/v1/intention/`,
        payload,
        {
          headers: {
            Authorization: `Token ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const data = response.data;
      if (!data.client_secret) {
        throw new Error('استجابة Paymob لا تحتوي على client_secret.');
      }
      const clientSecret = data.client_secret;
      const intentionId = String(data.id);

      return {
        clientSecret,
        publicKey: this.publicKey,
        intentionId,
        amount,
        currency: this.currency,
        integrationId: this.integrationId,
        specialReference,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to create Paymob Intention: ${error?.response?.data ? JSON.stringify(error.response.data) : error.message}`,
      );
      const errorMessage =
        error?.response?.data?.message ??
        error?.message ??
        'فشل في إنشاء جلسة الدفع عبر Paymob.';
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Verifies the HMAC SHA-512 signature on Paymob callbacks
   * Following Paymob's 20-field canonical lexicographical specification
   */
  verifyHmac(obj: any, providedHmac: string): boolean {
    if (!obj || !providedHmac) {
      return false;
    }

    // Handle nested order ID
    const orderId =
      obj.order && typeof obj.order === 'object' && obj.order.id !== undefined
        ? obj.order.id
        : obj.order !== undefined && obj.order !== null
          ? obj.order
          : '';

    // Standard 20 fields in exact alphabetical order
    const fields = [
      obj.amount_cents,
      obj.created_at,
      obj.currency,
      obj.error_occured, // single 'r' is intentional per Paymob spec
      obj.has_parent_transaction,
      obj.id,
      obj.integration_id,
      obj.is_3d_secure,
      obj.is_auth,
      obj.is_capture,
      obj.is_refunded,
      obj.is_standalone_payment,
      obj.is_voided,
      orderId,
      obj.owner,
      obj.pending,
      obj.source_data?.pan ?? '',
      obj.source_data?.sub_type ?? '',
      obj.source_data?.type ?? '',
      obj.success,
    ];

    const concatenatedString = fields
      .map((val) => (val === null || val === undefined ? '' : String(val)))
      .join('');

    const calculatedHmac = crypto
      .createHmac('sha512', this.hmacSecret)
      .update(concatenatedString)
      .digest('hex');

    const isValid =
      calculatedHmac.toLowerCase() === String(providedHmac).toLowerCase();

    if (!isValid) {
      this.logger.warn(
        `Paymob HMAC mismatch. Calculated: ${calculatedHmac}, Provided: ${providedHmac}`,
      );
    }

    return isValid;
  }

  /**
   * Inquires a transaction directly from Paymob API
   */
  async getTransaction(transactionId: string | number) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/acceptance/transactions/${transactionId}`,
        {
          headers: {
            Authorization: `Token ${this.secretKey}`,
          },
        },
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to inquire transaction ${transactionId}: ${error.message}`,
      );
      return null;
    }
  }

  getPublicKey(): string {
    return this.publicKey;
  }

  getIntegrationId(): number {
    return this.integrationId;
  }
}
