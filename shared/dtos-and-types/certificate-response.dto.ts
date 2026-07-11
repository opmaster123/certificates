import { ApiProperty } from '@nestjs/swagger';

export class CertificateResponseDto {
  @ApiProperty({ description: 'The unique ULID of the certificate' })
  id: string;

  @ApiProperty({ description: 'The public certificate code (raw)' })
  certificateNumber: string;

  @ApiProperty({ description: 'Formatted certificate code for display' })
  formattedCertificateNumber: string;

  @ApiProperty({ description: 'Name of the student' })
  studentName: string;

  @ApiProperty({ description: 'The certification type (e.g., CIA, CMA)' })
  certType: string;

  @ApiProperty({ description: 'Title of the course or exam' })
  courseTitle: string;

  @ApiProperty({ description: 'English title of the course or exam' })
  englishTitle: string;

  @ApiProperty({ description: 'Arabic title of the course or exam' })
  arabicTitle: string;

  @ApiProperty({ description: 'Date the certificate was issued (formatted)' })
  issueDate: string;

  @ApiProperty({ description: 'Raw database issue date' })
  issuedAt: string;

  @ApiProperty({ description: 'Date the certificate expires' })
  expiryDate: string;

  @ApiProperty({ description: 'Number of credit hours' })
  hours: string;

  @ApiProperty({ description: 'The ID of the user' })
  userId: string;

  @ApiProperty({ description: 'The ID of the test variant' })
  testVariantId: string;

  constructor(cert?: any) {
    this.id = cert?.id ?? '';
    this.certificateNumber = cert?.certificateNumber ?? '';
    
    const num = cert?.certificateNumber || '';
    this.formattedCertificateNumber = num.length >= 6 
      ? `KH-${num.substring(2, 6)}-${num.substring(6)}`
      : num;

    const first = cert?.user?.firstName || '';
    const last = cert?.user?.lastName || '';
    this.studentName = `${first} ${last}`.trim() || 'طالب خطى';
    
    this.certType = cert?.testVariant?.test?.cert || '';
    this.courseTitle = cert?.testVariant?.test?.englishTitle || cert?.testVariant?.test?.title || '';
    this.englishTitle = cert?.testVariant?.test?.englishTitle || cert?.testVariant?.test?.title || '';
    this.arabicTitle = cert?.testVariant?.test?.arabicTitle || '';
    
    this.issueDate = cert?.issuedAt ? cert.issuedAt.toISOString().split('T')[0].replace(/-/g, '/') : '';
    this.issuedAt = cert?.issuedAt ? (cert.issuedAt instanceof Date ? cert.issuedAt.toISOString() : new Date(cert.issuedAt).toISOString()) : '';
    this.expiryDate = cert?.expiryDate ? (cert.expiryDate instanceof Date ? cert.expiryDate.toISOString() : new Date(cert.expiryDate).toISOString()) : '';
    
    const tierName = cert?.testVariant?.tierName || '';
    const metrics = { SMALL: '2', MEDIUM: '4', LARGE: '6' };
    this.hours = metrics[tierName] || '4';

    this.userId = cert?.userId ?? '';
    this.testVariantId = cert?.testVariantId ?? '';
  }
}
