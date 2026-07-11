import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import {
  PaymentResponseDto,
  CreateIntentionResponseDto,
  ConfirmPaymentDto,
} from '@shared/dtos-and-types';

export const ApiPaymentsTags = () =>
  applyDecorators(ApiTags('Payments'));

export const ApiCreateIntentionDoc = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Create Paymob Intention for Pixel checkout',
    }),
    ApiResponse({
      status: 201,
      description: 'Intention created successfully, returns clientSecret for Pixel.',
      type: CreateIntentionResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bundle tests not completed or invalid state.',
    }),
    ApiResponse({
      status: 404,
      description: 'No active bundle or individual test waiting for payment.',
    }),
  );

export const ApiConfirmDoc = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Confirm completed Paymob payment from Pixel callback',
    }),
    ApiBody({
      type: ConfirmPaymentDto,
      required: false,
    }),
    ApiResponse({
      status: 200,
      description: 'Payment confirmed and certificates issued.',
      type: PaymentResponseDto,
    }),
  );

export const ApiWebhookDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Paymob Transaction Processed webhook receiver (HMAC SHA-512 validated)',
    }),
    ApiResponse({
      status: 200,
      description: 'Callback received and processed.',
    }),
  );
