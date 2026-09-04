import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';

type RequestWithId = Request & { id?: string };

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<RequestWithId>();
    const response = ctx.getResponse<Response>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload = isHttpException ? exception.getResponse() : null;
    const message = this.resolveMessage(payload, exception, status);

    this.logger.error(
      {
        err: exception,
        requestId: request.id,
        method: request.method,
        path: request.originalUrl || request.url,
        statusCode: status,
      },
      'Request failed',
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.originalUrl || request.url,
      requestId: request.id,
      message,
    });
  }

  private resolveMessage(
    payload: string | object | null,
    exception: unknown,
    status: number,
  ) {
    if (typeof payload === 'string') {
      return payload;
    }

    if (payload && typeof payload === 'object') {
      const message = (payload as Record<string, unknown>)['message'];
      if (Array.isArray(message)) {
        return message;
      }
      if (typeof message === 'string') {
        return message;
      }
    }

    if (exception instanceof Error && exception.message) {
      return status === HttpStatus.INTERNAL_SERVER_ERROR
        ? 'Internal server error'
        : exception.message;
    }

    return status === HttpStatus.INTERNAL_SERVER_ERROR
      ? 'Internal server error'
      : 'Request failed';
  }
}