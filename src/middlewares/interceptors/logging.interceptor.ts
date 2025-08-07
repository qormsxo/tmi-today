import { CallHandler, ExecutionContext, Injectable,  NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { WinstonLogger } from 'src/config/logging/logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: WinstonLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    
    // 요청 로깅
    this.logger.log(`📥 ${method} ${url} - ${JSON.stringify(body)}`);

    const now = Date.now();
    return next.handle().pipe(
      tap((response) => {
        // 응답 로깅
        this.logger.log(`📤 ${method} ${url} - ${Date.now() - now}ms`);
      }),
      
    );
  }
}
