import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('TmiController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/tmi/today (GET) 요청은 성공해야 한다', () => {
    return request(app.getHttpServer())
      .get('/tmi/today')
      .expect(200)
      .expect((res) => {
        expect(typeof res.text).toBe('string');
      });
  }, 20000);
});
