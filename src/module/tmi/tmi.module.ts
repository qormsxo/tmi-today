import { Module } from '@nestjs/common';
import { TmiController } from './tmi.controller';
import { TmiService } from './tmi.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TmiController],
  providers: [TmiService],
})
export class TmiModule {}
