import { Controller, Get } from '@nestjs/common';
import { TmiService } from './tmi.service';


@Controller('tmi')
export class TmiController {
  constructor(private readonly tmiService: TmiService) {}

  @Get('today')
  getTodaysTmi(): Promise<string> {
    return this.tmiService.getTodaysTmi();
  }
}
