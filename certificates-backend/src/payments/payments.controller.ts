import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConfirmPaymentDto } from '@shared/dtos-and-types';
import {
  ApiPaymentsTags,
  ApiCreateIntentionDoc,
  ApiConfirmDoc,
  ApiWebhookDoc,
} from './payments.swagger';

@ApiPaymentsTags()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * 1. Create Paymob Intention for Pixel checkout (Frontend initiates)
   */
  @Post('intention')
  @UseGuards(JwtAuthGuard)
  @ApiCreateIntentionDoc()
  createIntention(@Req() req: any) {
    return this.paymentsService.createIntention(req.user.id);
  }

  /**
   * 2. Confirm payment after Pixel frontend onSuccess
   */
  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @ApiConfirmDoc()
  confirm(@Req() req: any, @Body() body: ConfirmPaymentDto) {
    return this.paymentsService.confirmPayment(req.user.id, body);
  }

  /**
   * 3. Paymob Webhook (POST callback - authoritative source of truth)
   * Validates HMAC SHA-512 before processing
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiWebhookDoc()
  handleWebhook(@Body() body: any, @Query('hmac') queryHmac: string) {
    return this.paymentsService.handleWebhook(body, queryHmac);
  }

  /**
   * 4. Paymob Redirect URL (GET callback)
   * Redirects user back to frontend /certificates with transaction parameters
   */
  @Get('callback')
  handleCallback(@Query() query: any, @Res() res: any) {
    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.COOLIFY_URL ||
      (process.env.COOLIFY_FQDN ? `https://${process.env.COOLIFY_FQDN}` : '') ||
      (process.env.NODE_ENV === 'production' ? 'https://certificates.khutta.app' : 'http://localhost:8080');
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(query)) {
      if (val !== undefined && val !== null) {
        params.append(key, String(val));
      }
    }
    const targetUrl = `${frontendUrl}/certificates?${params.toString()}`;
    return res.redirect(targetUrl);
  }
}
