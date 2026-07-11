import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, CertType } from '@prisma/client';
import { CertificateResponseDto } from '@shared/dtos-and-types';
import { attachMetrics } from '@shared/pricing';
import { ulid } from 'ulid';
import { deriveCertificateNumber } from '../utils';

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Standalone internal function to acquire/issue a certificate for a user upon test completion.
   * Creates the UserCertificate record with initial null dates and updates user CPE hours.
   */
  async acquireCertificate(userId: string, testVariantId: string) {
    // 1. Fetch the test variant and calculate credit hours
    const variant: any = await this.prisma.testVariant.findUnique({
      where: { id: testVariantId },
      include: { test: true },
    });

    if (!variant) {
      throw new NotFoundException('معرّف الاختبار المحدد غير صالح.');
    }

    attachMetrics(variant);

    // 2. Determine unique certificate number with collision protection
    let certId = ulid();
    let certificateNumber = deriveCertificateNumber(certId);
    let attempts = 0;
    while (attempts < 5) {
      const existing = await this.prisma.userCertificate.findUnique({
        where: { certificateNumber },
      });
      if (!existing) break;
      certId = ulid();
      certificateNumber = deriveCertificateNumber(certId);
      attempts++;
    }

    // 3. Create the certificate with initial null dates
    const cert = await this.prisma.userCertificate.create({
      data: {
        id: certId,
        certificateNumber,
        userId,
        testVariantId,
        startDate: null,
        endDate: null,
        issueDate: null,
      },
      include: {
        user: true,
        testVariant: {
          include: {
            test: true,
          },
        },
      },
    });

    // 4. Update the user's total CPE hours
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totalCpeHours: {
          increment: variant.hours,
        },
      },
    });

    this.logger.log(`Certificate issued: ${certificateNumber} (User: ${userId}, Variant: ${testVariantId}, CPE: +${variant.hours}h)`);
    return cert;
  }

  /**
   * Standalone batch function to acquire/issue all certificates for a bundle atomically.
   * Creates all UserCertificate records and updates user CPE hours in a single atomic transaction.
   */
  async acquireBundleCertificates(userId: string, testVariantIds: string[]) {
    const variants: any[] = await this.prisma.testVariant.findMany({
      where: { id: { in: testVariantIds } },
      include: { test: true },
    });

    if (variants.length === 0) {
      throw new BadRequestException('لا توجد اختبارات صالحة في هذه الباقة.');
    }

    let totalHoursToAdd = 0;
    const certsData: {
      id: string;
      certificateNumber: string;
      userId: string;
      testVariantId: string;
      startDate: null;
      endDate: null;
      issueDate: null;
    }[] = [];

    for (const testVariantId of testVariantIds) {
      const variant = variants.find((v) => v.id === testVariantId);
      if (!variant) continue;

      attachMetrics(variant);
      totalHoursToAdd += variant.hours;

      let certId = ulid();
      let certificateNumber = deriveCertificateNumber(certId);
      let attempts = 0;
      while (attempts < 5) {
        const existing = await this.prisma.userCertificate.findUnique({
          where: { certificateNumber },
        });
        if (!existing) break;
        certId = ulid();
        certificateNumber = deriveCertificateNumber(certId);
        attempts++;
      }

      certsData.push({
        id: certId,
        certificateNumber,
        userId,
        testVariantId,
        startDate: null,
        endDate: null,
        issueDate: null,
      });
    }

    const createdCerts = await this.prisma.$transaction(async (tx) => {
      const results: any[] = [];
      for (const data of certsData) {
        const cert = await tx.userCertificate.create({
          data,
          include: {
            user: true,
            testVariant: {
              include: { test: true },
            },
          },
        });
        results.push(cert);
      }

      if (totalHoursToAdd > 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            totalCpeHours: {
              increment: totalHoursToAdd,
            },
          },
        });
      }

      return results;
    });

    this.logger.log(`Bundle certificates issued (${createdCerts.length} certs, +${totalHoursToAdd}h CPE) for User: ${userId}`);
    return createdCerts;
  }

  async findOne(identifier: string) {
    // Normalize code: uppercase and strip hyphens (e.g. "kh-9a3f-2b" -> "KH9A3F2B")
    const normalizedCertificateNumber = identifier
      .toUpperCase()
      .replace(/-/g, '');

    const cert = await this.prisma.userCertificate.findFirst({
      where: {
        OR: [
          { id: identifier }, // Search by internal ULID
          { certificateNumber: normalizedCertificateNumber }, // Search by public short code
        ],
      },
      include: {
        user: true,
        testVariant: {
          include: {
            test: true,
          },
        },
      },
    });

    if (!cert) {
      throw new NotFoundException('الشهادة المطلوبة غير موجودة.');
    }

    return new CertificateResponseDto(cert);
  }

  async findMyCertificates(
    userId: string,
    query?: { page?: number; cert?: string; limit?: number },
  ) {
    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? query.limit : 9;
    const skip = (page - 1) * limit;

    const where: Prisma.UserCertificateWhereInput = {
      userId,
    };

    if (query?.cert) {
      const certs = query.cert
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean);
      if (certs.length > 0) {
        where.testVariant = {
          test: {
            cert: { in: certs as CertType[] },
          },
        };
      }
    }

    const [certs, total, unassignedCount] = await Promise.all([
      this.prisma.userCertificate.findMany({
        where,
        include: {
          user: true,
          testVariant: {
            include: {
              test: true,
            },
          },
        },
        orderBy: {
          id: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.userCertificate.count({ where }),
      this.prisma.userCertificate.count({
        where: {
          ...where,
          OR: [{ startDate: null }, { endDate: null }, { issueDate: null }],
        },
      }),
    ]);

    const items = certs.map((cert) => new CertificateResponseDto(cert));
    const hasMore = skip + items.length < total;

    return {
      items,
      total,
      page,
      limit,
      hasMore,
      unassignedCount,
      hasUnassignedDates: unassignedCount > 0,
    };
  }

  async updateDates(
    userId: string,
    id: string,
    data: { startDate?: string; endDate?: string },
  ) {
    // 1. Find the certificate belonging to the user strictly by primary key ID
    const cert = await this.prisma.userCertificate.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        user: true,
        testVariant: {
          include: {
            test: true,
          },
        },
      },
    });

    if (!cert) {
      throw new NotFoundException('الشهادة المطلوبة غير موجودة أو لا تملك صلاحية تعديلها.');
    }

    // 2. Enforce irreversibility: Dates cannot be changed once set
    if (cert.startDate !== null && cert.endDate !== null) {
      throw new BadRequestException(
        'لا يمكن تعديل التواريخ بعد تحديدها، حيث أن عملية تحديد التواريخ نهائية وغير قابلة للتغيير.',
      );
    }

    // 3. Validate presence of dates
    if (!data.startDate || !data.endDate) {
      throw new BadRequestException('يجب تحديد تاريخ البدء وتاريخ الانتهاء معاً.');
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('صيغة التواريخ المدخلة غير صالحة.');
    }

    // 4. Validate gap constraints: min 1 day, max credit hours of the certificate
    const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    const diffTime = endMidnight.getTime() - startMidnight.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
      throw new BadRequestException(
        'الحد الأدنى للفارق بين تاريخ البدء وتاريخ الانتهاء هو يوم واحد على الأقل (يجب أن يكون تاريخ الانتهاء بعد تاريخ البدء).',
      );
    }

    const variant: any = cert.testVariant;
    attachMetrics(variant);
    const maxAllowedDays = variant.hours;

    if (diffDays > maxAllowedDays) {
      throw new BadRequestException(
        `الحد الأقصى للفارق بين تاريخ البدء وتاريخ الانتهاء هو ${maxAllowedDays} أيام (بما يطابق عدد الساعات المعتمدة للشهادة).`,
      );
    }

    // 6. Derive issueDate (exactly 2 days after endDate)
    const issueDate = new Date(endMidnight.getTime() + 2 * 24 * 60 * 60 * 1000);

    // 7. Validate issueDate is never in the future (max today)
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (issueDate.getTime() > todayMidnight.getTime()) {
      throw new BadRequestException(
        'تاريخ الإصدار المحتسب (تاريخ الانتهاء + يومين) لا يمكن أن يكون في المستقبل بعد تاريخ اليوم. يرجى اختيار تاريخ انتهاء قبل يومين على الأقل من تاريخ اليوم.',
      );
    }

    // 8. Save dates
    const updated = await this.prisma.userCertificate.update({
      where: { id: cert.id },
      data: {
        startDate: startMidnight,
        endDate: endMidnight,
        issueDate,
      },
      include: {
        user: true,
        testVariant: {
          include: {
            test: true,
          },
        },
      },
    });

    this.logger.log(`Certificate dates updated for ${cert.certificateNumber} (User: ${userId}, IssueDate: ${issueDate.toISOString().split('T')[0]})`);
    return new CertificateResponseDto(updated);
  }
}
