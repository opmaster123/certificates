import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { BundlesService } from './bundles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { ConfirmBundleDto, ProgressBundleDto } from '@shared/dtos-and-types';
import {
  ApiBundlesTags,
  ApiConfirmBundleDoc,
  ApiProgressBundleDoc,
} from './bundles.swagger';

@ApiBundlesTags()
@Controller('bundles')
@UseGuards(JwtAuthGuard)
export class BundlesController {
  constructor(private readonly bundlesService: BundlesService) {}

  @Post('confirm')
  @ApiConfirmBundleDoc()
  confirm(@Req() req: any, @Body() body: ConfirmBundleDto) {
    return this.bundlesService.confirm(req.user.id, body.variantIds);
  }

  @Post('progress')
  @ApiProgressBundleDoc()
  progress(@Req() req: any, @Body() body: ProgressBundleDto) {
    return this.bundlesService.progress(req.user.id, body.testVariantId);
  }
}
