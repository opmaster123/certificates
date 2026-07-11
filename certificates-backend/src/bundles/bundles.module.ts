import { Module } from '@nestjs/common';
import { BundlesService } from './bundles.service';
import { BundlesController } from './bundles.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallbackSecretKey',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [BundlesService],
  controllers: [BundlesController],
  exports: [BundlesService],
})
export class BundlesModule {}
