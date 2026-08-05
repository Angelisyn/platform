import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { APP_NAME } from '@angelisyn/config';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return `Welcome to ${APP_NAME}`;
  }
}
