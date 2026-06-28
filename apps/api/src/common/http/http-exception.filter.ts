import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';
import { ZodError } from 'zod';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ requestId?: string }>();
    const status = this.getStatus(exception);
    const payload = this.getPayload(exception);

    if (status >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    response.status(status).json({
      data: null,
      meta: { requestId: request.requestId },
      error: payload,
    });
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) return exception.getStatus();
    if (exception instanceof ZodError) return HttpStatus.BAD_REQUEST;
    if (exception instanceof Prisma.PrismaClientKnownRequestError && exception.code === 'P2002') return HttpStatus.CONFLICT;
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getPayload(exception: unknown): { code: string; message: string; fields?: Record<string, string[]> } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && response && 'message' in response) {
        const maybeMessage = (response as { message?: string | string[] }).message;
        return {
          code: this.codeFromStatus(exception.getStatus()),
          message: Array.isArray(maybeMessage) ? maybeMessage.join(', ') : maybeMessage ?? exception.message,
        };
      }
      return { code: this.codeFromStatus(exception.getStatus()), message: exception.message };
    }
    if (exception instanceof ZodError) {
      return {
        code: 'VALIDATION_ERROR',
        message: exception.issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`).join(', '),
      };
    }
    if (exception instanceof Prisma.PrismaClientKnownRequestError && exception.code === 'P2002') {
      return { code: 'CONFLICT', message: 'A unique constraint was violated.' };
    }
    return { code: 'INTERNAL_SERVER_ERROR', message: 'Unexpected server error.' };
  }

  private codeFromStatus(status: number): string {
    const codes: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      429: 'RATE_LIMITED',
    };
    return codes[status] ?? 'HTTP_ERROR';
  }
}
