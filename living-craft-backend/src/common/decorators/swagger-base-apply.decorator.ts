import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

/**
 * Swagger 기본 데코레이터를 적용하는 유틸리티 함수
 * @param decorators - 적용할 추가 데코레이터들
 * @returns 합성된 데코레이터
 */
export function swaggerBaseApplyDecorator(...decorators: any[]) {
  return applyDecorators(...decorators);
}

/**
 * Swagger 기본 설정을 클래스에 적용하는 데코레이터
 * - Bearer 인증 적용
 * - 401 에러 응답 문서화
 */
export function SwaggerBaseApply() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: '인증 실패',
      schema: {
        example: {
          success: false,
          error: 'UnauthorizedException',
          message: '인증이 필요합니다.',
          statusCode: 401,
          timestamp: '2024-01-01T00:00:00.000Z',
          path: '/api/endpoint',
        },
      },
    }),
  );
}
