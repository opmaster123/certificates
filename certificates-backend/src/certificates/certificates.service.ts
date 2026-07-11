import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, CertType } from '@prisma/client';
import { CertificateResponseDto } from '@shared/dtos-and-types/certificate-response.dto';

@Injectable()
export class CertificatesService {
  constructor(private readonly prisma: PrismaService) {}

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
    query?: { page?: number; cert?: string },
  ) {
    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = 9;
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

    const [certs, total] = await Promise.all([
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
          issuedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.userCertificate.count({ where }),
    ]);

    const items = certs.map((cert) => new CertificateResponseDto(cert));
    const hasMore = skip + items.length < total;

    return {
      items,
      total,
      page,
      limit,
      hasMore,
    };
  }
}
