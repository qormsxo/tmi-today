import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { WinstonLogger } from 'src/config/logging/logger';

/**
 * 애플리케이션에서 발생한 모든 예외를 잡아 적절한 HTTP 응답을 보냅니다.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost, private readonly logger: WinstonLogger) { }

  /**
   * 예외를 잡아 적절한 HTTP 응답을 보냅니다.
   *
   * @param {*} exception - 잡을 예외
   * @param {ArgumentsHost} host - 아규먼트 호스트
   * @returns {void}
   */
  catch(exception: any, host: ArgumentsHost): void {


        


    // 특정 상황에서 `httpAdapter`가 생성자에서 바로 사용되지 않을 수 있으므로
    // 여기서 해결합니다.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const httpStatus = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const request = ctx.getRequest();

    // 유효성 검사 예외일 경우, 여러 오류 메시지를 처리하도록 수정
    if (httpStatus === HttpStatus.BAD_REQUEST && exception.response.message && Array.isArray(exception.response.message)) {
  
      exception.message = exception.response.message;  // class-validator에서 반환된 유효성 검사 오류 메시지를 그대로 사용
    }

    // WinstonLogger를 사용하여 에러 로그를 기록합니다.
    this.logger.error(exception.message, exception.stack);

    // 응답 본문을 구성합니다.
    const responseBody = {
      statusCode: httpStatus,
      error: exception.code,
      message: exception.message,
      description: exception.description,
      timestamp: new Date().toISOString(),
      traceId: request.id,
      path: request.url,
    };


    // HTTP 응답을 보냅니다.
    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
