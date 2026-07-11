import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CertificateResponseDto } from '@shared/dtos-and-types/certificate-response.dto';

export const ApiCertificatesTags = () => ApiTags('Certificates');

export const ApiFindMyCertificatesDoc = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Retrieve paginated certificates belonging to the signed-in user',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (default: 1)',
    }),
    ApiQuery({
      name: 'cert',
      required: false,
      type: String,
      description: 'Filter by cert type(s), comma-separated',
    }),
    ApiResponse({
      status: 200,
      description: 'Certificates retrieved successfully.',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );

export const ApiFindOneCertificateDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Retrieve a certificate by ULID ID or public Certificate Number',
    }),
    ApiParam({
      name: 'identifier',
      description: 'Certificate ULID ID or public Certificate Number (e.g., KH12345678)',
    }),
    ApiResponse({
      status: 200,
      description: 'Certificate retrieved successfully.',
      type: CertificateResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Certificate not found.' }),
  );

export const ApiUpdateCertificateDatesDoc = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Set start date and end date on a certificate (irreversible operation)',
    }),
    ApiParam({
      name: 'id',
      description: 'Certificate ULID ID or public Certificate Number',
    }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['startDate', 'endDate'],
        properties: {
          startDate: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-10T00:00:00.000Z',
            description: 'Training start date',
          },
          endDate: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-14T00:00:00.000Z',
            description: 'Training end date (gap in days must not exceed credit hours)',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Certificate dates updated successfully.',
      type: CertificateResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Invalid dates, gap exceeded, or dates already set.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    ApiResponse({ status: 404, description: 'Certificate not found.' }),
  );
