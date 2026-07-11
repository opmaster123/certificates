import { Controller, Get, Post, Delete, Body, UseGuards, Req } from '@nestjs/common';
import { BundlesService } from './bundles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('Bundles')
@ApiBearerAuth()
@Controller('bundles')
@UseGuards(JwtAuthGuard)
export class BundlesController {
  constructor(private readonly bundlesService: BundlesService) {}

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm a shopping cart selection into an active bundle' })
  @ApiBody({
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
  })
  @ApiResponse({ status: 201, description: 'Bundle successfully confirmed.' })
  @ApiResponse({ status: 400, description: 'User already has an active bundle or lock.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  confirm(@Req() req: any, @Body('variantIds') variantIds: string[]) {
    return this.bundlesService.confirm(req.user.id, variantIds);
  }

  @Get('active')
  @ApiOperation({ summary: 'Retrieve the active confirmed bundle' })
  @ApiResponse({ status: 200, description: 'Return active bundle details or null if no active bundle exists.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getActive(@Req() req: any) {
    return this.bundlesService.getActive(req.user.id);
  }

  @Post('progress')
  @ApiOperation({ summary: 'Submit progress for a test within the active bundle' })
  @ApiBody({
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
  })
  @ApiResponse({ status: 200, description: 'Progress saved successfully.' })
  @ApiResponse({ status: 400, description: 'No active bundle found or test not in bundle.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  progress(@Req() req: any, @Body('testVariantId') testVariantId: string) {
    return this.bundlesService.progress(req.user.id, testVariantId);
  }

  @Delete('cancel')
  @ApiOperation({ summary: 'Cancel the active bundle and wipe all its progress' })
  @ApiResponse({ status: 200, description: 'Bundle successfully cancelled.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  cancel(@Req() req: any) {
    return this.bundlesService.cancel(req.user.id);
  }
}
