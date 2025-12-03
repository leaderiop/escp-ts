import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ZodError } from 'zod';
import { ProblemDetails, PROBLEM_TYPES } from '../../schemas/problem.schema';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const problemDetails = this.buildProblemDetails(exception, request);

    this.logger.error(
      `${request.method} ${request.url} - ${problemDetails.status} ${problemDetails.title}: ${problemDetails.detail}`,
      exception instanceof Error ? exception.stack : undefined
    );

    response
      .status(problemDetails.status)
      .header('Content-Type', 'application/problem+json')
      .json(problemDetails);
  }

  private buildProblemDetails(exception: unknown, request: Request): ProblemDetails {
    const requestId = request.headers['x-request-id'] as string | undefined;
    const timestamp = new Date().toISOString();
    const instance = request.url;

    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'object' && response !== null && 'type' in response) {
        return {
          ...(response as ProblemDetails),
          instance,
          timestamp,
          requestId,
        };
      }

      const status = exception.getStatus();
      return {
        type: this.getErrorType(status),
        title: this.getErrorTitle(status),
        status,
        detail: typeof response === 'string' ? response : exception.message,
        instance,
        timestamp,
        requestId,
      };
    }

    if (exception instanceof ZodError) {
      return {
        type: PROBLEM_TYPES.VALIDATION_ERROR,
        title: 'Validation Error',
        status: HttpStatus.BAD_REQUEST,
        detail: 'Request validation failed',
        instance,
        timestamp,
        requestId,
        errors: exception.errors.map((err) => ({
          pointer: '/' + err.path.join('/'),
          message: err.message,
          received: 'received' in err ? err.received : undefined,
        })),
      };
    }

    return {
      type: PROBLEM_TYPES.INTERNAL_ERROR,
      title: 'Internal Server Error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: exception instanceof Error ? exception.message : 'An unexpected error occurred',
      instance,
      timestamp,
      requestId,
    };
  }

  private getErrorType(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return PROBLEM_TYPES.VALIDATION_ERROR;
      case HttpStatus.NOT_FOUND:
        return PROBLEM_TYPES.NOT_FOUND;
      case HttpStatus.PAYLOAD_TOO_LARGE:
        return PROBLEM_TYPES.FILE_TOO_LARGE;
      case HttpStatus.UNSUPPORTED_MEDIA_TYPE:
        return PROBLEM_TYPES.UNSUPPORTED_MEDIA_TYPE;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return PROBLEM_TYPES.CONVERSION_FAILED;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return PROBLEM_TYPES.SERVICE_UNAVAILABLE;
      default:
        return PROBLEM_TYPES.INTERNAL_ERROR;
    }
  }

  private getErrorTitle(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request';
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      case HttpStatus.PAYLOAD_TOO_LARGE:
        return 'File Too Large';
      case HttpStatus.UNSUPPORTED_MEDIA_TYPE:
        return 'Unsupported Media Type';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'Conversion Failed';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'Service Unavailable';
      default:
        return 'Internal Server Error';
    }
  }
}
