import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { TmiService } from './tmi.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { UserModel } from '../../generated/prisma/models/User';

@Controller('tmi')
export class TmiController {
  constructor(private readonly tmiService: TmiService) {}

  @Get('today')
  @UseGuards(JwtAuthGuard)
  getTodaysTmi(@Req() req): Promise<string> {
    const user = req.user as UserModel;
    return this.tmiService.getTodaysTmi(user);
  }
}
