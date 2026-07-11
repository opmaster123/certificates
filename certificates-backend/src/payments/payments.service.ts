import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CertificatesService } from '../certificates/certificates.service';
import { IndividualTestsService } from '../individual-tests/individual-tests.service';
import { BundlesService } from '../bundles/bundles.service';
import { AuthService } from '../auth/auth.service';
import {
  PaymentRequestDto,
  PaymentResponseDto,
  CertificateResponseDto,
} from '@shared/dtos-and-types';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly certificatesService: CertificatesService,
    private readonly individualTestsService: IndividualTestsService,
    private readonly bundlesService: BundlesService,
    private readonly authService: AuthService,
  ) {}

  async pay(userId: string, _paymentData?: PaymentRequestDto): Promise<PaymentResponseDto> {
    // 1. Validate eligibility: Check for active individual test lock
    const activeIndTest = await this.individualTestsService.getActive(userId);

    // Or check for active bundle if no individual test lock
    const activeBundle = !activeIndTest
      ? await this.bundlesService.getActive(userId)
      : null;

    if (!activeIndTest && !activeBundle) {
      throw new NotFoundException('لا توجد باقة مكتملة أو اختبار فردي بانتظار الدفع.');
    }

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
    }

    // 2. Simulate payment gateway processing (3 seconds delay)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 3. Fulfillment: Issue certificates and remove active locks
    if (activeIndTest) {
      const cert = await this.certificatesService.acquireCertificate(
        userId,
        activeIndTest.testVariantId,
      );

      await this.authService.cancelActiveLock(userId);

      return new PaymentResponseDto({
        success: true,
        type: 'individual',
        certificates: [new CertificateResponseDto(cert)],
        count: 1,
      });
    }

    // Bundle fulfillment
    const certificates: CertificateResponseDto[] = [];
    for (const item of activeBundle!.tests) {
      const cert = await this.certificatesService.acquireCertificate(
        userId,
        item.variantId,
      );
      certificates.push(new CertificateResponseDto(cert));
    }

    await this.authService.cancelActiveLock(userId);

    return new PaymentResponseDto({
      success: true,
      type: 'bundle',
      certificates,
      count: certificates.length,
    });
  }
}
