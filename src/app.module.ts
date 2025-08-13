import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './module/user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { WinstonLogger } from './config/logging/logger';
import { TmiModule } from './module/tmi/tmi.module';
import { AuthModule } from './module/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV
        ? [`.env.${process.env.NODE_ENV}`, '.env']
        : ['.env'],
    }),
    PrismaModule,
    TmiModule,
    AuthModule,
    UserModule,
  ],
  controllers: [],
  providers: [WinstonLogger],
})
export class AppModule {}
