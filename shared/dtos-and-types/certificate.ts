export interface Certificate {
  id: string;
  certificateNumber: string;
  formattedCertificateNumber: string;
  studentName: string;
  certType: string;
  courseTitle: string;
  englishTitle?: string;
  arabicTitle?: string;
  issueDate: string;
  hours: string;
  userId?: string;
  testVariantId?: string;
  issuedAt?: string;
  expiryDate?: string;
}
