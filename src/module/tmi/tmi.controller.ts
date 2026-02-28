import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TmiService } from './tmi.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { UserModel } from '../../generated/prisma/models/User';
import { GetTmiQueryDto } from './dto/get-tmi-query.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('tmi')
export class TmiController {
  constructor(private readonly tmiService: TmiService) {}

  @Get('categories')
  getCategories(@Req() req) {
    const userId = req.user?.id;
    return this.tmiService.getCategories(userId);
  }

  @Get('categories/my-likes')
  @UseGuards(JwtAuthGuard)
  getMyLikedCategories(@Req() req) {
    const user = req.user as UserModel;
    return this.tmiService.getMyLikedCategories(user.id);
  }

  @Post('categories/:id/like')
  @UseGuards(JwtAuthGuard)
  toggleCategoryLike(@Req() req, @Param('id') id: string) {
    const user = req.user as UserModel;
    return this.tmiService.toggleCategoryLike(user.id, id);
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard)
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.tmiService.createCategory(dto);
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard)
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.tmiService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard)
  deleteCategory(@Param('id') id: string) {
    return this.tmiService.deleteCategory(id);
  }

  @Get('today')
  @UseGuards(JwtAuthGuard)
  getTodaysTmi(@Req() req, @Query() query: GetTmiQueryDto): Promise<string> {
    const user = req.user as UserModel;
    return this.tmiService.getTodaysTmi(user, query.category);
  }
}
