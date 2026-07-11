import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { attachMetrics } from '@shared/pricing';

@Injectable()
export class IndividualTestsService {
  constructor(private readonly prisma: PrismaService) {}

  async finish(userId: string, testVariantId: string) {
    // 1. Check if user already has an active bundle or another active individual test
    const activeBundle = await this.prisma.activeBundle.findUnique({
      where: { userId },
    });
    if (activeBundle) {
      throw new BadRequestException('لديك باقة اختبارات نشطة ومحجوزة حالياً. لا يمكنك حجز اختبار فردي.');
    }

    const existingIndLock = await this.prisma.activeIndividualTest.findUnique({
      where: { userId },
    });
    if (existingIndLock && existingIndLock.testVariantId !== testVariantId) {
      throw new BadRequestException('لديك اختبار فردي مكتمل وغير مدفوع. يجب إكماله أو إلغاؤه أولاً.');
    }

    // 2. Validate that the variant ID exists
    const variant: any = await this.prisma.testVariant.findUnique({
      where: { id: testVariantId },
      include: { test: true },
    });
    if (!variant) {
      throw new NotFoundException('معرّف الاختبار المحدد غير صالح.');
    }

    // 3. Lock user with this active individual test awaiting payment
    const activeIndTest = await this.prisma.activeIndividualTest.upsert({
      where: { userId },
      create: {
        userId,
        testVariantId,
      },
      update: {
        testVariantId,
      },
    });

    return {
      success: true,
      activeTest: activeIndTest,
    };
  }

  async getActive(userId: string) {
    const activeIndTest = await this.prisma.activeIndividualTest.findUnique({
      where: { userId },
      include: {
        testVariant: {
          include: {
            test: true,
          },
        },
      },
    });
    if (!activeIndTest) return null;


    const variant: any = activeIndTest.testVariant;
    attachMetrics(variant);

    return {
      id: activeIndTest.id,
      userId: activeIndTest.userId,
      createdAt: activeIndTest.createdAt,
      testVariantId: activeIndTest.testVariantId,
      testTitle: variant.test.arabicTitle || variant.test.englishTitle || variant.test.title || 'اختبار التقييم',
      arabicTitle: variant.test.arabicTitle,
      englishTitle: variant.test.englishTitle,
      cert: variant.test.cert,
      tierName: variant.tierName,
      hours: variant.hours,
      duration: variant.duration,
      questionCount: variant.questionCount,
      price: variant.price,
    };
  }
}
