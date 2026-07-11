import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, TierName, CertType } from '@prisma/client';
import { attachMetrics } from '@shared/pricing';
import { PaginatedTestVariantsResponseDto } from '@shared/dtos-and-types/paginated-test-variants-response.dto';
import { TestVariantDetailResponseDto } from '@shared/dtos-and-types/test-variant-detail-response.dto';

@Injectable()
export class TestVariantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query?: { page?: number; cert?: string }) {
    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = 27;
    const skip = (page - 1) * limit;

    const where: Prisma.TestVariantWhereInput = {};

    if (query?.cert) {
      const certs = query.cert
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean);
      if (certs.length > 0) {
        where.test = {
          cert: { in: certs as CertType[] },
        };
      }
    }

    const [variants, total] = await Promise.all([
      this.prisma.testVariant.findMany({
        where,
        include: { test: true },
        skip,
        take: limit,
        orderBy: { id: 'asc' },
      }),
      this.prisma.testVariant.count({ where }),
    ]);

    const items = variants.map((v) => attachMetrics(v));
    const hasMore = skip + items.length < total;

    return new PaginatedTestVariantsResponseDto({
      items,
      total,
      page,
      limit,
      hasMore,
    });
  }

  async findOne(id: string) {
    const variant: any = await this.prisma.testVariant.findUnique({
      where: { id },
      include: {
        test: {
          include: {
            questions: true,
          },
        },
      },
    });
    if (!variant) {
      throw new NotFoundException(`Test variant with ID "${id}" not found`);
    }
    attachMetrics(variant);
    const questions = variant.test.questions.slice(0, variant.questionCount);
    const { questions: _, ...testWithoutQuestions } = variant.test;
    const result = {
      ...variant,
      test: testWithoutQuestions,
      questions,
    };
    return new TestVariantDetailResponseDto(result);
  }
}
