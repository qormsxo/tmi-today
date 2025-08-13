import { Controller, Get, UseGuards } from '@nestjs/common';
import { TmiService } from './tmi.service';
import { JwtAuthGuard } from '../auth/auth.guard';


@Controller('tmi')
export class TmiController {
  constructor(private readonly tmiService: TmiService) {}

  @Get('today')
  @UseGuards(JwtAuthGuard)
  getTodaysTmi(): Promise<string> {
    return this.tmiService.getTodaysTmi();
  }
}
