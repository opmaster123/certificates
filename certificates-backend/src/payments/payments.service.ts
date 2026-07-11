import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { CertificatesService } from '../certificates/certificates.service';
import { IndividualTestsService } from '../individual-tests/individual-tests.service';
import { BundlesService } from '../bundles/bundles.service';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymobService } from './paymob.service';
import {
  PaymentResponseDto,
  CertificateResponseDto,
  CreateIntentionResponseDto,
  ConfirmPaymentDto,
} from '@shared/dtos-and-types';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly processedTransactions = new Set<string | number>();

  constructor(
    private readonly certificatesService: CertificatesService,
    private readonly individualTestsService: IndividualTestsService,
    private readonly bundlesService: BundlesService,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    private readonly paymobService: PaymobService,
  ) {}

  /**
   * Creates a Paymob Intention for the user's active checkout item
   */
  async createIntention(userId: string): Promise<CreateIntentionResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود.');
    }

    // 1. Validate eligibility
    const activeIndTest = await this.individualTestsService.getActive(userId);
    const activeBundle = !activeIndTest
      ? await this.bundlesService.getActive(userId)
      : null;

    if (!activeIndTest && !activeBundle) {
      throw new NotFoundException('لا توجد باقة مكتملة أو اختبار فردي بانتظار الدفع.');
    }

    let payableAmount = 0;
    let itemTitle = '';
    let intentionItems: Array<{
      name: string;
      amount: number;
      description: string;
      quantity: number;
    }> | undefined = undefined;

    if (activeBundle) {
      const allFinished =
        activeBundle.tests &&
        activeBundle.tests.length > 0 &&
        activeBundle.tests.every((item) => item.finished);

      if (!allFinished) {
        throw new BadRequestException(
          'يجب إكمال جميع اختبارات الباقة قبل إتمام عملية الدفع.',
        );
      }

      if (typeof activeBundle.discountedPrice !== 'number' || activeBundle.discountedPrice <= 0) {
        throw new BadRequestException('تعذر تحديد سعر الباقة المطلوب دفعها بدقة.');
      }

      payableAmount = activeBundle.discountedPrice;
      const totalAmountInCents = Math.round(payableAmount * 100);
      const originalTotalPrice =
        activeBundle.originalPrice > 0 ? activeBundle.originalPrice : payableAmount;

      let accumulatedCents = 0;
      intentionItems = activeBundle.tests.map((test, index) => {
        const isLast = index === activeBundle.tests.length - 1;
        let itemCents: number;

        if (isLast) {
          itemCents = totalAmountInCents - accumulatedCents;
        } else {
          const itemPrice =
            typeof test.price === 'number' && test.price > 0
              ? test.price
              : payableAmount / activeBundle.tests.length;
          const ratio = itemPrice / originalTotalPrice;
          itemCents = Math.round(ratio * totalAmountInCents);
          accumulatedCents += itemCents;
        }

        const itemName = test.testTitle.trim();

        return {
          name: itemName,
          amount: itemCents,
          description: itemName,
          quantity: 1,
        };
      });

      itemTitle = `باقة اختبارات معتمدة (${activeBundle.tests.length} اختبار)`;
    } else if (activeIndTest) {
      if (typeof activeIndTest.price !== 'number' || activeIndTest.price <= 0) {
        throw new BadRequestException('تعذر تحديد سعر الاختبار المطلوب دفعه بدقة.');
      }

      payableAmount = activeIndTest.price;
      if (!activeIndTest.testTitle?.trim()) {
        throw new BadRequestException('عنوان الاختبار المطلوب دفعه غير متوفر.');
      }

      itemTitle = activeIndTest.testTitle.trim();

      intentionItems = [
        {
          name: itemTitle,
          amount: Math.round(payableAmount * 100),
          description: itemTitle,
          quantity: 1,
        },
      ];
    }

    // 2. Call Paymob Intention API
    const intention = await this.paymobService.createIntention({
      userId,
      amount: payableAmount,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
      },
      title: itemTitle,
      items: intentionItems,
    });

    return {
      clientSecret: intention.clientSecret,
      publicKey: intention.publicKey,
      intentionId: intention.intentionId,
      amount: intention.amount,
      currency: intention.currency,
      integrationId: intention.integrationId,
    };
  }

  /**
   * Internal fulfillment logic: Issues certificates and unlocks user
   */
  async fulfillOrder(userId: string): Promise<PaymentResponseDto> {
    const activeIndTest = await this.individualTestsService.getActive(userId);
    const activeBundle = !activeIndTest
      ? await this.bundlesService.getActive(userId)
      : null;

    if (!activeIndTest && !activeBundle) {
      // User might already have been fulfilled by the webhook or previous call
      return new PaymentResponseDto({
        success: true,
        type: 'individual',
        certificates: [],
        count: 0,
        message: 'تم تفعيل الشهادات مسبقاً بنجاح.',
      });
    }

    if (activeIndTest) {
      const cert = await this.certificatesService.acquireCertificate(
        userId,
        activeIndTest.testVariantId,
      );

      await this.authService.cancelActiveLock(userId);

      this.logger.log(`Fulfilled individual test certificate for user ${userId}`);

      return new PaymentResponseDto({
        success: true,
        type: 'individual',
        certificates: [new CertificateResponseDto(cert)],
        count: 1,
      });
    }

    // Bundle fulfillment: Issue certificates for all bundle items atomically
    const variantIds = activeBundle!.tests.map((item) => item.variantId);
    const createdCerts =
      await this.certificatesService.acquireBundleCertificates(
        userId,
        variantIds,
      );

    // Clear the active bundle and all its items so no active bundle remains
    const bundleRecord = await this.prisma.activeBundle.findUnique({
      where: { userId },
    });
    if (bundleRecord) {
      await this.prisma.activeBundleItem.deleteMany({
        where: { bundleId: bundleRecord.id },
      });
      await this.prisma.activeBundle.delete({
        where: { userId },
      });
    }

    this.logger.log(
      `Fulfilled bundle of ${createdCerts.length} certificates for user ${userId} and cleared active bundle`,
    );

    const certificates = createdCerts.map(
      (cert) => new CertificateResponseDto(cert),
    );

    return new PaymentResponseDto({
      success: true,
      type: 'bundle',
      certificates,
      count: certificates.length,
    });
  }

  /**
   * Webhook handler for Paymob Transaction Processed callback
   * Authenticates HMAC SHA-512 and fulfills order asynchronously
   */
  async handleWebhook(body: any, queryHmac?: string) {
    const obj = body?.obj || body;
    if (!obj) {
      this.logger.warn('Received Paymob webhook with no obj payload');
      return { success: false, message: 'Invalid payload' };
    }

    const transactionId = obj.id;
    if (transactionId && this.processedTransactions.has(transactionId)) {
      this.logger.log(`Transaction ${transactionId} already processed (idempotent duplicate)`);
      return { success: true, message: 'Already processed' };
    }

    // Verify HMAC SHA-512
    const hmacToVerify = queryHmac || body?.hmac;
    if (hmacToVerify) {
      const isValid = this.paymobService.verifyHmac(obj, hmacToVerify);
      if (!isValid) {
        this.logger.error(`Invalid HMAC signature for transaction ${transactionId}`);
        throw new UnauthorizedException('Invalid Paymob HMAC signature.');
      }
    } else {
      this.logger.warn('Webhook received without HMAC signature in query or body');
    }

    // Verify transaction success
    const isSuccess =
      obj.success === true ||
      String(obj.success).toLowerCase() === 'true';

    if (!isSuccess) {
      this.logger.warn(
        `Transaction ${transactionId} failed or was declined: error_occured=${obj.error_occured}`,
      );
      return { success: false, message: 'Transaction not successful' };
    }

    // Extract userId from special_reference or extras
    let userId: string | null = null;
    const specialRef: string =
      obj.order?.special_reference ||
      obj.special_reference ||
      obj.order?.items?.[0]?.name ||
      '';

    if (specialRef.startsWith('USER_')) {
      const parts = specialRef.split('_');
      if (parts.length >= 2) {
        userId = parts[1];
      }
    }

    if (!userId && obj.order?.extra?.userId) {
      userId = obj.order.extra.userId;
    }
    if (!userId && obj.data?.extras?.userId) {
      userId = obj.data.extras.userId;
    }

    if (!userId) {
      this.logger.error(
        `Could not extract userId from Paymob callback for transaction ${transactionId}`,
      );
      return { success: false, message: 'User ID missing in transaction reference' };
    }

    if (transactionId) {
      this.processedTransactions.add(transactionId);
    }

    const result = await this.fulfillOrder(userId);
    return {
      success: true,
      message: 'Payment verified and certificates issued',
      result,
    };
  }

  /**
   * Confirmation endpoint called by client after Pixel onSuccess
   * Fulfills order or verifies transaction with Paymob
   */
  async confirmPayment(
    userId: string,
    confirmDto: ConfirmPaymentDto,
  ): Promise<PaymentResponseDto> {
    const { transactionId } = confirmDto;

    if (transactionId) {
      // Inquire transaction if desired
      const tx = await this.paymobService.getTransaction(transactionId);
      if (tx) {
        const isSuccess =
          tx.success === true || String(tx.success).toLowerCase() === 'true';
        if (!isSuccess) {
          throw new BadRequestException('عملية الدفع لم تكتمل بنجاح في سجلات Paymob.');
        }
      }
      this.processedTransactions.add(transactionId);
    }

    return this.fulfillOrder(userId);
  }
}
