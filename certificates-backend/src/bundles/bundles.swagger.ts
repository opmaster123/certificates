import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

export const ApiBundlesTags = () =>
  applyDecorators(ApiTags('Bundles'), ApiBearerAuth());

export const ApiConfirmBundleDoc = () =>
  applyDecorators(
    ApiOperation({ summary: 'Confirm a shopping cart selection into an active bundle' }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['variantIds'],
        properties: {
          variantIds: {
            type: 'array',
            items: { type: 'string' },
            example: ['01J0000000000000000000001', '01J0000000000000000000002'],
            description: 'Array of test variant IDs to include in the confirmed bundle',
          },
        },
      },
    }),
    ApiResponse({ status: 201, description: 'Bundle successfully confirmed.' }),
    ApiResponse({ status: 400, description: 'User already has an active bundle or lock.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );

export const ApiGetActiveBundleDoc = () =>
  applyDecorators(
    ApiOperation({ summary: 'Retrieve the active confirmed bundle' }),
    ApiResponse({ status: 200, description: 'Return active bundle details or null if no active bundle exists.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );

export const ApiProgressBundleDoc = () =>
  applyDecorators(
    ApiOperation({ summary: 'Submit progress for a test within the active bundle' }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['testVariantId'],
        properties: {
          testVariantId: {
            type: 'string',
            example: '01J0000000000000000000001',
            description: 'Test variant ID completed within the active bundle',
          },
        },
      },
    }),
    ApiResponse({ status: 200, description: 'Progress saved successfully.' }),
    ApiResponse({ status: 400, description: 'No active bundle found or test not in bundle.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );

export const ApiCancelBundleDoc = () =>
  applyDecorators(
    ApiOperation({ summary: 'Cancel the active bundle and wipe all its progress' }),
    ApiResponse({ status: 200, description: 'Bundle successfully cancelled.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
