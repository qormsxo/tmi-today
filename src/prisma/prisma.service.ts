import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import mysql from 'mysql2/promise';
import { PrismaClient } from '../generated/prisma/client';

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

    // Prisma 7: MariaDB adapter 사용 (MySQL 호환)
    // const pool = mysql.createPool(databaseUrl);
    // const pool = mysql.createPool({
    //   host: dbHost,
    //   port: parseInt(dbPort),
    //   user: dbUser,
    //   password: dbPassword,
    //   database: dbName,
    // });
    const adapter = new PrismaMariaDb(databaseUrl);

    super({
      adapter,
    });
  }
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }
}


