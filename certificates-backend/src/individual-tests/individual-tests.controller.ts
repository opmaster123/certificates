import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { IndividualTestsService } from './individual-tests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiIndividualTestsTags,
  ApiFinishIndividualTestDoc,
} from './individual-tests.swagger';

@ApiIndividualTestsTags()
@Controller('individual-tests')
@UseGuards(JwtAuthGuard)
export class IndividualTestsController {
  constructor(private readonly individualTestsService: IndividualTestsService) {}

  @Post('finish')
  @ApiFinishIndividualTestDoc()
  finish(@Req() req: any, @Body() body: { testVariantId: string }) {
    return this.individualTestsService.finish(req.user.id, body.testVariantId);
  }
}
