import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const dbUser = process.env.DBUSER;
    const dbPassword = process.env.DBPW;
    const dbHost = process.env.DBHOST ?? 'localhost';
    const dbPort = process.env.DBPORT ?? '3306';
    const dbName = process.env.DBNAME ?? 'tmi';
    const databaseUrlFromEnv = process.env.DATABASE_URL;

    const databaseUrl =
      databaseUrlFromEnv ??
      `mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }
}


