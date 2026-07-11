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

export const ApiGetActiveIndividualTestDoc = () =>
  applyDecorators(
    ApiOperation({ summary: 'Retrieve the active finished individual test lock details' }),
    ApiResponse({ status: 200, description: 'Return active test lock details or null.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );

export const ApiCancelIndividualTestDoc = () =>
  applyDecorators(
    ApiOperation({ summary: 'Cancel the finished individual test progress and release lock' }),
    ApiResponse({ status: 200, description: 'Lock successfully removed.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
