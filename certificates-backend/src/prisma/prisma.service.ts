import 'dotenv/config';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ulid } from 'ulid';
import { deriveCertificateNumber } from '../utils';

function formatDatabaseUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.password) {
      const decodedPassword = decodeURIComponent(parsedUrl.password);
      parsedUrl.password = encodeURIComponent(decodedPassword);
    }
    return parsedUrl.toString();
  } catch (e) {
    return url;
  }
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private prisma: any;

  constructor() {
    const databaseUrl = formatDatabaseUrl(process.env.DATABASE_URL);
    super({
      adapter: new PrismaPg({ connectionString: databaseUrl }),
    });

    // Create the extended client that automatically generates ULIDs and derived certificate numbers.
    this.prisma = this.$extends({
      query: {
        $allModels: {
          async create({ model, args, query }: any) {
            if (args.data) {
              if (!args.data.id) {
                args.data.id = ulid();
              }
              if (model === 'UserCertificate' && !args.data.certificateNumber) {
                args.data.certificateNumber = deriveCertificateNumber(
                  args.data.id,
                );
              }
            }

            // Retry loop in case of certificateNumber unique key collision
            if (model === 'UserCertificate') {
              let attempts = 0;
              const maxAttempts = 3;

              while (attempts < maxAttempts) {
                try {
                  return await query(args);
                } catch (error: any) {
                  const isCertificateCollision =
                    error.code === 'P2002' &&
                    error.meta?.target?.includes('certificateNumber');

                  if (isCertificateCollision) {
                    attempts++;
                    if (attempts >= maxAttempts) {
                      throw error;
                    }
                    args.data.id = ulid();
                    args.data.certificateNumber = deriveCertificateNumber(
                      args.data.id,
                    );
                    continue;
                  }
                  throw error;
                }
              }
            }

            return query(args);
          },
          async createMany({ model, args, query }: any) {
            if (Array.isArray(args.data)) {
              for (const item of args.data) {
                if (item) {
                  const it = item as any;
                  if (!it.id) {
                    it.id = ulid();
                  }
                  if (model === 'UserCertificate' && !it.certificateNumber) {
                    it.certificateNumber = deriveCertificateNumber(it.id);
                  }
                }
              }
            }
            return query(args);
          },
        },
      },
    });

    // Route database queries to the extended client, and lifecycle methods to the base client
    return new Proxy(this, {
      get(target, prop, receiver) {
        const lifecycleMethods = [
          'onModuleInit',
          'onModuleDestroy',
          '$connect',
          '$disconnect',
        ];
        if (lifecycleMethods.includes(prop as string)) {
          return Reflect.get(target, prop, receiver);
        }
        return Reflect.get(target.prisma, prop);
      },
    }) as unknown as PrismaService;
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
