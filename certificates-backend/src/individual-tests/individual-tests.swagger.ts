import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

export const ApiIndividualTestsTags = () =>
  applyDecorators(ApiTags('Individual Tests'), ApiBearerAuth());

export const ApiFinishIndividualTestDoc = () =>
  applyDecorators(
    ApiOperation({ summary: 'Register the completion of an individual test and lock the platform' }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['testVariantId'],
        properties: {
          testVariantId: {
            type: 'string',
            example: '01J0000000000000000000001',
            description: 'Test variant ID completed individually',
          },
        },
      },
    }),
    ApiResponse({ status: 201, description: 'Individual test completion registered.' }),
    ApiResponse({ status: 400, description: 'User already has an active bundle or lock.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
