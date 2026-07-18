import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: '성공 여부',
    example: false,
  })
  success: boolean;

  @ApiProperty({
    description: '에러 메시지',
    example: '요청을 처리하는 중 오류가 발생했습니다.',
  })
  message: string;

  @ApiProperty({
    description: 'HTTP 상태 코드',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: '에러 상세 정보',
    required: false,
  })
  error?: any;

  constructor(message: string, statusCode: number, error?: any) {
    this.success = false;
    this.message = message;
    this.statusCode = statusCode;
    this.error = error;
  }
}

export class UnAuthorizedResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: '로그인 상태',
    example: false,
  })
  isLogin: boolean;

  constructor(message: string = '인증이 필요합니다.') {
    super(message, 401);
    this.isLogin = false;
  }
}

export class ValidationErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: '검증 오류 상세 정보',
    example: [
      {
        field: 'email',
        errors: ['이메일 형식이 올바르지 않습니다.'],
      },
    ],
  })
  validationErrors: Array<{
    field: string;
    errors: string[];
  }>;

  constructor(message: string, validationErrors: Array<{ field: string; errors: string[] }>) {
    super(message, 400);
    this.validationErrors = validationErrors;
  }
}

// Swagger에서 사용할 스키마
export const ErrorBaseResponseSchema = ErrorResponseDto;
