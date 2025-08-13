import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test', override: true });

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    });
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
    await app.close();
  });

  it('POST /auth/login (200) 로그인 성공', async () => {
    const email = `login_${Date.now()}@ex.com`;
    const password = 'P@ssw0rd!';
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, passwordHash, emailVerified: false },
    });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('POST /auth/login (401) 잘못된 비밀번호로 실패', async () => {
    const email = `login_fail_${Date.now()}@ex.com`;
    const passwordHash = await bcrypt.hash('P@ssw0rd!', 10);
    await prisma.user.create({
      data: { email, passwordHash, emailVerified: false },
    });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'wrong' })
      .expect(401);
  });
});


