import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { TmiService } from './tmi.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { UserModel } from '../../generated/prisma/models/User';
import { GetTmiQueryDto } from './dto/get-tmi-query.dto';

@Controller('tmi')
export class TmiController {
  constructor(private readonly tmiService: TmiService) {}

  @Get('categories')
  getCategories() {
    return this.tmiService.getCategories();
  }

  @Get('today')
  @UseGuards(JwtAuthGuard)
  getTodaysTmi(@Req() req, @Query() query: GetTmiQueryDto): Promise<string> {
    const user = req.user as UserModel;
    return this.tmiService.getTodaysTmi(user, query.category);
  }
}
