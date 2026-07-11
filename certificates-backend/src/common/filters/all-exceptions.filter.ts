import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : null;

    let message: any = 'Internal server error';
    if (exceptionResponse) {
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        message = (exceptionResponse as any).message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const logPrefix = `[${request.method}] ${request.originalUrl} -> HTTP ${status}`;
    if (status >= 500) {
      const stack = exception instanceof Error ? exception.stack : '';
      this.logger.error(`${logPrefix} [ERROR]: ${typeof message === 'object' ? JSON.stringify(message) : message}`, stack);
    } else {
      this.logger.warn(`${logPrefix} [WARN]: ${typeof message === 'object' ? JSON.stringify(message) : message}`);
    }

    if (exceptionResponse && typeof exceptionResponse === 'object') {
      response.status(status).json(exceptionResponse);
    } else {
      response.status(status).json({
        statusCode: status,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }
}
