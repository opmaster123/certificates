import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { PaymentRequestDto, PaymentResponseDto } from '@shared/dtos-and-types';

export const ApiPaymentsTags = () =>
  applyDecorators(ApiTags('Payments'), ApiBearerAuth());

export const ApiPayDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Process payment to acquire certificates and release active lock',
    }),
    ApiBody({
      type: PaymentRequestDto,
      required: false,
      description: 'Optional credit card and payment processing information',
    }),
    ApiResponse({
      status: 200,
      description: 'Payment successful, certificates issued and lock released.',
      type: PaymentResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'All bundle tests must be completed before payment.',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized.',
    }),
    ApiResponse({
      status: 404,
      description: 'No active bundle or individual test waiting for payment.',
    }),
  );
