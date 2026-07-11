import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get hello greeting' })
  @ApiResponse({
    status: 200,
    description: 'Return a simple hello greeting.',
    type: String,
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
