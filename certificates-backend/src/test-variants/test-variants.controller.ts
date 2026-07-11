import { Controller, Get, Param, Query } from '@nestjs/common';
import { TestVariantsService } from './test-variants.service';
import {
  ApiTestVariantsTags,
  ApiFindAllTestVariantsDoc,
  ApiFindOneTestVariantDoc,
} from './test-variants.swagger';

@ApiTestVariantsTags()
@Controller('test-variants')
export class TestVariantsController {
  constructor(private readonly testVariantsService: TestVariantsService) {}

  @Get()
  @ApiFindAllTestVariantsDoc()
  findAll(@Query('page') page?: string, @Query('cert') cert?: string) {
    return this.testVariantsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      cert,
    });
  }

  @Get(':id')
  @ApiFindOneTestVariantDoc()
  findOne(@Param('id') id: string) {
    return this.testVariantsService.findOne(id);
  }
}
