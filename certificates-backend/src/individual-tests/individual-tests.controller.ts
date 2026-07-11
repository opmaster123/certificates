import { Controller, Get, Post, Delete, Body, UseGuards, Req } from '@nestjs/common';
import { IndividualTestsService } from './individual-tests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('Individual Tests')
@ApiBearerAuth()
@Controller('individual-tests')
@UseGuards(JwtAuthGuard)
export class IndividualTestsController {
  constructor(private readonly individualTestsService: IndividualTestsService) {}

  @Post('finish')
  @ApiOperation({ summary: 'Register the completion of an individual test and lock the platform' })
  @ApiBody({
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
  })
  @ApiResponse({ status: 201, description: 'Individual test completion registered.' })
  @ApiResponse({ status: 400, description: 'User already has an active bundle or lock.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  finish(@Req() req: any, @Body('testVariantId') testVariantId: string) {
    return this.individualTestsService.finish(req.user.id, testVariantId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Retrieve the active finished individual test lock details' })
  @ApiResponse({ status: 200, description: 'Return active test lock details or null.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getActive(@Req() req: any) {
    return this.individualTestsService.getActive(req.user.id);
  }

  @Delete('cancel')
  @ApiOperation({ summary: 'Cancel the finished individual test progress and release lock' })
  @ApiResponse({ status: 200, description: 'Lock successfully removed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  cancel(@Req() req: any) {
    return this.individualTestsService.cancel(req.user.id);
  }
}
