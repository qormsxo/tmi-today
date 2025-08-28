import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonLogger } from './config/logging/logger';
import { AllExceptionsFilter } from './middlewares/filters/all-exception.filter';
import { LoggingInterceptor } from './middlewares/interceptors/logging.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  const logger = app.get(WinstonLogger);
  app.useLogger(logger);

  // 전역 예외 필터 등록
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost), logger));
  // 글로벌 인터셉터 등록
  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('TMI Today API')
    .setDescription('TMI Today API 문서')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();