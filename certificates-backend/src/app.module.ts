import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { existsSync } from 'fs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TestVariantsModule } from './test-variants/test-variants.module';
import { AuthModule } from './auth/auth.module';
import { BundlesModule } from './bundles/bundles.module';
import { IndividualTestsModule } from './individual-tests/individual-tests.module';
import { CertificatesModule } from './certificates/certificates.module';
import { PaymentsModule } from './payments/payments.module';

const candidates = [
  join(process.cwd(), 'certificates', 'dist'),
  join(process.cwd(), 'dist'),
  join(__dirname, '..', '..', 'certificates', 'dist'),
  join(__dirname, '..', '..', '..', '..', 'certificates', 'dist'),
];
const clientPath = candidates.find((p) => existsSync(p));
if (clientPath) {
  console.log(`[AppModule] Static client assets found at: ${clientPath}`);
} else {
  console.warn('[AppModule] No static client assets found, serving API only');
}

const staticServeModule = clientPath
  ? [
      ServeStaticModule.forRoot({
        rootPath: clientPath,
        exclude: ['/api{/*path}', '/docs{/*path}'],
      }),
    ]
  : [];

@Module({
  imports: [
    ...staticServeModule,
    PrismaModule,
    TestVariantsModule,
    AuthModule,
    BundlesModule,
    IndividualTestsModule,
    CertificatesModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

