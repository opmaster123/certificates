import { Module, forwardRef } from '@nestjs/common';
import { IndividualTestsService } from './individual-tests.service';
import { IndividualTestsController } from './individual-tests.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallbackSecretKey',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [IndividualTestsService],
  controllers: [IndividualTestsController],
  exports: [IndividualTestsService],
})
export class IndividualTestsModule {}
