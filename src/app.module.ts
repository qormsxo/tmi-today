import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TmiModule } from './tmi/tmi.module';
import { WinstonLogger } from './config/logging/logger';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), TmiModule],
  controllers: [],
  providers: [WinstonLogger],
})
export class AppModule {}
