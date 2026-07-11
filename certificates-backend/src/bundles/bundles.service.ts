import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { attachMetrics, calculateBundlePricing } from '@shared/pricing';

@Injectable()
export class BundlesService {
  constructor(private readonly prisma: PrismaService) {}

  async confirm(userId: string, variantIds: string[]) {
    // 1. Check if user already has an active bundle or active individual test lock
    const activeBundle = await this.prisma.activeBundle.findUnique({
      where: { userId },
    });
    if (activeBundle) {
      throw new BadRequestException('لديك باقة اختبارات نشطة ومحجوزة حالياً. لا يمكنك حجز باقة جديدة.');
    }

    const activeIndTest = await this.prisma.activeIndividualTest.findUnique({
      where: { userId },
    });
    if (activeIndTest) {
      throw new BadRequestException('لديك اختبار فردي مكتمل وغير مدفوع. يجب إكماله أو إلغاؤه أولاً.');
    }

    if (!variantIds || variantIds.length === 0) {
      throw new BadRequestException('يجب اختيار اختبار واحد على الأقل لحجز الباقة.');
    }

    // 2. Validate that all variant IDs exist
    const variants = await this.prisma.testVariant.findMany({
      where: { id: { in: variantIds } },
    });
    if (variants.length !== variantIds.length) {
      throw new BadRequestException('بعض معرفات الاختبارات المحددة غير صالحة.');
    }

    // 3. Create active bundle with bundle items
    return this.prisma.activeBundle.create({
      data: {
        userId,
        items: {
          create: variantIds.map((variantId) => ({
            testVariantId: variantId,
            finished: false,
          })),
        },
      },
      include: {
        items: {
          include: {
            testVariant: {
              include: {
                test: true,
              },
            },
          },
        },
      },
    });
  }

  async getActive(userId: string) {
    const activeBundle = await this.prisma.activeBundle.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            testVariant: {
              include: {
                test: true,
              },
            },
          },
        },
      },
    });
    if (!activeBundle) return null;

    // Map properties to match the frontend expected ConfirmedBundle shape

    const tests = activeBundle.items.map((item) => {
      const variant: any = item.testVariant;
      attachMetrics(variant);
      return {
        variantId: variant.id,
        testId: variant.testId,
        testTitle: variant.test.title,
        cert: variant.test.cert,
        tierName: variant.tierName,
        hours: variant.hours,
        duration: variant.duration,
        questionCount: variant.questionCount,
        price: variant.price,
        finished: item.finished,
        finishedAt: item.finishedAt,
      };
    });

    const pricing = calculateBundlePricing(tests);

    return {
      id: activeBundle.id,
      userId: activeBundle.userId,
      createdAt: activeBundle.createdAt,
      tests,
      ...pricing,
    };
  }

  async progress(userId: string, testVariantId: string) {
    const activeBundle = await this.prisma.activeBundle.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!activeBundle) {
      throw new NotFoundException('لا توجد باقة نشطة لهذا المستخدم.');
    }

    const bundleItem = activeBundle.items.find(
      (item) => item.testVariantId === testVariantId,
    );

    if (!bundleItem) {
      throw new BadRequestException('هذا الاختبار ليس جزءاً من باقتك النشطة.');
    }

    // Update the progress
    await this.prisma.activeBundleItem.update({
      where: { id: bundleItem.id },
      data: {
        finished: true,
        finishedAt: new Date(),
      },
    });

    // Verify if all items in bundle are now finished
    const updatedBundle = await this.prisma.activeBundle.findUnique({
      where: { userId },
      include: { items: true },
    });

    const allFinished = updatedBundle?.items.every((item) => item.finished) ?? false;

    return {
      success: true,
      allFinished,
    };
  }

  async cancel(userId: string) {
    const activeBundle = await this.prisma.activeBundle.findUnique({
      where: { userId },
    });
    if (!activeBundle) {
      throw new NotFoundException('لا توجد باقة نشطة لإلغائها.');
    }

    await this.prisma.activeBundle.delete({
      where: { userId },
    });

    return { success: true };
  }
}
