import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ErrorResponseDto,
  ValidationErrorResponseDto,
} from '@common/dto/response/error-response.dto';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Validation 에러 처리
    if (
      status === HttpStatus.BAD_REQUEST &&
      typeof exceptionResponse === 'object'
    ) {
      const validationResponse = exceptionResponse as any;

      if (
        validationResponse.message &&
        Array.isArray(validationResponse.message)
      ) {
        const validationErrors = this.formatValidationErrors(
          validationResponse.message,
        );
        const errorResponse = new ValidationErrorResponseDto(
          '입력 데이터가 유효하지 않습니다.',
          validationErrors,
        );

        return response.status(status).json(errorResponse);
      }
    }

    // 일반 에러 처리
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || '오류가 발생했습니다.';

    const errorResponse = new ErrorResponseDto(message, status);

    response.status(status).json(errorResponse);
  }

  private formatValidationErrors(
    messages: string[],
  ): Array<{ field: string; errors: string[] }> {
    const errorMap = new Map<string, string[]>();

    messages.forEach((message) => {
      // class-validator의 에러 메시지 파싱
      const match = message.match(/^(.+?) (.+)$/);
      if (match) {
        const field = match[1];
        const error = match[2];

        if (!errorMap.has(field)) {
          errorMap.set(field, []);
        }
        errorMap.get(field)!.push(error);
      } else {
        // 파싱할 수 없는 경우 general 필드로 처리
        if (!errorMap.has('general')) {
          errorMap.set('general', []);
        }
        errorMap.get('general')!.push(message);
      }
    });

    return Array.from(errorMap.entries()).map(([field, errors]) => ({
      field,
      errors,
    }));
  }
}
