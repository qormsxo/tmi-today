import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { execSync } from 'child_process';

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test', override: true });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

describe('User (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }, // 테스트 DB 사용
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


  it('POST /users/signup (201) 회원가입 성공', async () => {
    const email = `user_${Date.now()}@ex.com`;
    const res = await request(app.getHttpServer())
      .post('/users/signup')
      .send({ email, password: 'P@ssw0rd!', nickname: 'me' })
      .expect(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe(email);
  });

  it('POST /users/signup (409) 중복 이메일로 실패', async () => {
    const email = `dup_${Date.now()}@ex.com`;
    await request(app.getHttpServer())
      .post('/users/signup')
      .send({ email, password: 'P@ssw0rd!' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/users/signup')
      .send({ email, password: 'P@ssw0rd!' })
      .expect(409);
  });
});


