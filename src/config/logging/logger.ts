import { LoggerService } from '@nestjs/common';
import { createLogger, transports, format, Logger } from 'winston';
import { winstonOptions } from './winston.config'; // winston 설정 파일을 import

export class WinstonLogger implements LoggerService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger(winstonOptions); // winston 로거 생성
  }

  log(message: string) {
    this.logger.info(message); // 정보 로그
  }

  error(message: string, trace: string) {
    this.logger.error(`${message} - Trace: ${trace}`); // 에러 로그
  }

  warn(message: string) {
    this.logger.warn(message); // 경고 로그
  }

  debug(message: string) {
    this.logger.debug(message); // 디버그 로그
  }
}
