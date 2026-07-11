import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { attachMetrics } from '@shared/pricing';

@Injectable()
export class IndividualTestsService {
  constructor(private readonly prisma: PrismaService) {}

  async finish(userId: string, testVariantId: string) {
    // 1. Check if user already has an active bundle or active individual test lock
    const activeBundle = await this.prisma.activeBundle.findUnique({
      where: { userId },
    });
    if (activeBundle) {
      throw new BadRequestException('لديك باقة اختبارات نشطة ومحجوزة حالياً. لا يمكنك حجز اختبار فردي.');
    }

    const activeIndTest = await this.prisma.activeIndividualTest.findUnique({
      where: { userId },
    });
    if (activeIndTest) {
      throw new BadRequestException('لديك بالفعل اختبار فردي مكتمل وغير مدفوع. يجب إكماله أو إلغاؤه أولاً.');
    }

    // 2. Validate that the variant ID exists
    const variant = await this.prisma.testVariant.findUnique({
      where: { id: testVariantId },
      include: { test: true },
    });
    if (!variant) {
      throw new NotFoundException('معرّف الاختبار المحدد غير صالح.');
    }

    // 3. Create active individual test
    return this.prisma.activeIndividualTest.create({
      data: {
        userId,
        testVariantId,
      },
      include: {
        testVariant: {
          include: {
            test: true,
          },
        },
      },
    });
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
      testTitle: variant.test.title,
      cert: variant.test.cert,
      tierName: variant.tierName,
      hours: variant.hours,
      duration: variant.duration,
      questionCount: variant.questionCount,
      price: variant.price,
    };
  }

  async cancel(userId: string) {
    const activeIndTest = await this.prisma.activeIndividualTest.findUnique({
      where: { userId },
    });
    if (!activeIndTest) {
      throw new NotFoundException('لا يوجد اختبار فردي نشط حالياً لإلغائه.');
    }

    await this.prisma.activeIndividualTest.delete({
      where: { userId },
    });

    return { success: true };
  }
}
