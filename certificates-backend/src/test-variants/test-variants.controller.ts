import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { TestVariantsService } from './test-variants.service';
import { Prisma } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PaginatedTestVariantsResponseDto } from '@shared/dtos-and-types/paginated-test-variants-response.dto';
import { TestVariantDetailResponseDto } from '@shared/dtos-and-types/test-variant-detail-response.dto';

@ApiTags('Test Variants')
@Controller('test-variants')
export class TestVariantsController {
  constructor(private readonly testVariantsService: TestVariantsService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve paginated test variants' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'cert',
    required: false,
    type: String,
    description: 'Filter by cert type(s), comma-separated',
  })
  @ApiResponse({
    status: 200,
    description: 'Return paginated test variants.',
    type: PaginatedTestVariantsResponseDto,
  })
  findAll(@Query('page') page?: string, @Query('cert') cert?: string) {
    return this.testVariantsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      cert,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a test variant by ID' })
  @ApiParam({ name: 'id', description: 'Test variant ULID ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the matching test variant.',
    type: TestVariantDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Test variant not found.' })
  findOne(@Param('id') id: string) {
    return this.testVariantsService.findOne(id);
  }
}
