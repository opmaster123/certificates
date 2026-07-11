import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PaginatedTestVariantsResponseDto } from '@shared/dtos-and-types/paginated-test-variants-response.dto';
import { TestVariantDetailResponseDto } from '@shared/dtos-and-types/test-variant-detail-response.dto';

export const ApiTestVariantsTags = () => ApiTags('Test Variants');

export const ApiFindAllTestVariantsDoc = () =>
  applyDecorators(
    ApiOperation({ summary: 'Retrieve paginated test variants' }),
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
      description: 'Return paginated test variants.',
      type: PaginatedTestVariantsResponseDto,
    }),
  );

export const ApiFindOneTestVariantDoc = () =>
  applyDecorators(
    ApiOperation({ summary: 'Retrieve a test variant by ID' }),
    ApiParam({ name: 'id', description: 'Test variant ULID ID' }),
    ApiResponse({
      status: 200,
      description: 'Return the matching test variant.',
      type: TestVariantDetailResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Test variant not found.' }),
  );
