import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiAppTags, ApiGetHelloDoc } from './app.swagger';

@ApiAppTags()
@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiGetHelloDoc()
  getHealth(): string {
    return 'ok';
  }
}
