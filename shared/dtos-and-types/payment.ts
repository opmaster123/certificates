import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { CertificateResponseDto } from './certificate';

export class PaymentRequestDto {
  @ApiPropertyOptional({
    description: 'Name on the credit or debit card',
    example: 'Ahmad Al-Mansour',
  })
  cardName?: string;

  @ApiPropertyOptional({
    description: '16-digit card number',
    example: '4111222233334444',
  })
  cardNumber?: string;

  @ApiPropertyOptional({
    description: 'Expiration date in MM/YY format',
    example: '12/28',
  })
  cardExpiry?: string;

  @ApiPropertyOptional({
    description: 'Card verification code (CVV/CVC)',
    example: '123',
  })
  cardCvc?: string;
}

export class CreateIntentionResponseDto {
  @ApiProperty({
    description: 'Paymob Client Secret for Pixel / Unified checkout',
  })
  clientSecret: string;

  @ApiProperty({
    description: 'Paymob Public Key',
  })
  publicKey: string;

  @ApiProperty({
    description: 'Paymob Intention ID',
  })
  intentionId: string;

  @ApiProperty({
    description: 'Total payable amount in Egyptian Pounds (EGP)',
    example: 340,
  })
  amount: number;

  @ApiProperty({
    description: 'Payment Currency',
    example: 'EGP',
  })
  currency: string;

  @ApiProperty({
    description: 'Paymob Integration ID',
  })
  integrationId: number;
}

export class ConfirmPaymentDto {
  @ApiPropertyOptional({
    description: 'Paymob Transaction ID from callback or Pixel onSuccess',
  })
  transactionId?: string | number;

  @ApiPropertyOptional({
    description: 'Paymob Intention ID',
  })
  intentionId?: string;
}

export class PaymentResponseDto {
  @ApiProperty({
    description: 'Whether the payment and certificate issuance succeeded',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Type of payment completed (individual or bundle)',
    enum: ['individual', 'bundle'],
    example: 'individual',
  })
  type: 'individual' | 'bundle';

  @ApiProperty({
    description: 'List of issued certificates',
    type: () => [CertificateResponseDto],
  })
  certificates: CertificateResponseDto[];

  @ApiProperty({
    description: 'Total count of certificates issued',
    example: 1,
  })
  count: number;

  @ApiPropertyOptional({
    description: 'Optional message from payment processing',
  })
  message?: string;

  constructor(payload: {
    success: boolean;
    type: 'individual' | 'bundle';
    certificates: CertificateResponseDto[];
    count: number;
    message?: string;
  }) {
    this.success = payload.success;
    this.type = payload.type;
    this.certificates = payload.certificates;
    this.count = payload.count;
    this.message = payload.message;
  }
}

export type PaymentResult = PaymentResponseDto;
