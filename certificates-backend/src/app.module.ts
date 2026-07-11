import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TestVariantsModule } from './test-variants/test-variants.module';
import { AuthModule } from './auth/auth.module';
import { BundlesModule } from './bundles/bundles.module';
import { IndividualTestsModule } from './individual-tests/individual-tests.module';
import { CertificatesModule } from './certificates/certificates.module';

@Module({
  imports: [
    PrismaModule,
    TestVariantsModule,
    AuthModule,
    BundlesModule,
    IndividualTestsModule,
    CertificatesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

