import { ApiProperty } from '@nestjs/swagger';

export interface Certificate {
  id: string;
  certificateNumber: string;
  formattedCertificateNumber: string;
  studentName: string;
  certType: string;
  courseTitle: string;
  englishTitle: string;
  arabicTitle: string;
  startDate: string | null;
  endDate: string | null;
  issueDate: string | null;
  hours: string;
  userId: string;
  testVariantId: string;
}

export class CertificateResponseDto implements Certificate {
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

  @ApiProperty({
    description: 'Date the training program started (formatted YYYY/MM/DD or null)',
    nullable: true,
  })
  startDate: string | null;

  @ApiProperty({
    description: 'Date the training program ended (formatted YYYY/MM/DD or null)',
    nullable: true,
  })
  endDate: string | null;

  @ApiProperty({
    description:
      'Date the certificate was issued (derived as endDate + 2 days, formatted YYYY/MM/DD or null)',
    nullable: true,
  })
  issueDate: string | null;

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
    this.formattedCertificateNumber =
      num.length >= 6 ? `KH-${num.substring(2, 6)}-${num.substring(6)}` : num;

    const first = cert?.user?.firstName || '';
    const last = cert?.user?.lastName || '';
    this.studentName = `${first} ${last}`.trim() || 'طالب خطى';

    this.certType = cert?.testVariant?.test?.cert || '';
    this.courseTitle =
      cert?.testVariant?.test?.englishTitle || cert?.testVariant?.test?.title || '';
    this.englishTitle =
      cert?.testVariant?.test?.englishTitle || cert?.testVariant?.test?.title || '';
    this.arabicTitle = cert?.testVariant?.test?.arabicTitle || '';

    this.startDate = cert?.startDate
      ? cert.startDate instanceof Date
        ? cert.startDate.toISOString().split('T')[0].replace(/-/g, '/')
        : new Date(cert.startDate).toISOString().split('T')[0].replace(/-/g, '/')
      : null;
    this.endDate = cert?.endDate
      ? cert.endDate instanceof Date
        ? cert.endDate.toISOString().split('T')[0].replace(/-/g, '/')
        : new Date(cert.endDate).toISOString().split('T')[0].replace(/-/g, '/')
      : null;
    this.issueDate = cert?.issueDate
      ? cert.issueDate instanceof Date
        ? cert.issueDate.toISOString().split('T')[0].replace(/-/g, '/')
        : new Date(cert.issueDate).toISOString().split('T')[0].replace(/-/g, '/')
      : null;

    const tierName = cert?.testVariant?.tierName || '';
    const metrics: Record<string, string> = { SMALL: '2', MEDIUM: '4', LARGE: '6' };
    this.hours = metrics[tierName] || '4';

    this.userId = cert?.userId ?? '';
    this.testVariantId = cert?.testVariantId ?? '';
  }
}
