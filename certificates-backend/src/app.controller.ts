import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiAppTags, ApiGetHelloDoc } from './app.swagger';

@ApiAppTags()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiGetHelloDoc()
  getHello(): string {
    return this.appService.getHello();
  }
}
