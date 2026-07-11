import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentRequestDto } from '@shared/dtos-and-types';
import { ApiPaymentsTags, ApiPayDoc } from './payments.swagger';

@ApiPaymentsTags()
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('pay')
  @ApiPayDoc()
  pay(@Req() req: any, @Body() body: PaymentRequestDto) {
    return this.paymentsService.pay(req.user.id, body);
  }
}
