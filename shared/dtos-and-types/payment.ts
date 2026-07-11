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

  constructor(payload: {
    success: boolean;
    type: 'individual' | 'bundle';
    certificates: CertificateResponseDto[];
    count: number;
  }) {
    this.success = payload.success;
    this.type = payload.type;
    this.certificates = payload.certificates;
    this.count = payload.count;
  }
}

export type PaymentResult = PaymentResponseDto;
