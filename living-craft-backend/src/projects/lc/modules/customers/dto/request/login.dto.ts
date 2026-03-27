import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ERROR_MESSAGES } from '@common/constants';

export enum TossReferrer {
  DEFAULT = 'DEFAULT',
  SANDBOX = 'SANDBOX',
}

export class LoginDto {
  @ApiProperty({
    description: '토스 앱에서 발급받은 인가 코드',
    example: 'auth_code_12345',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING('인가 코드'),
  })
  @IsNotEmpty({
    message: ERROR_MESSAGES.VALIDATION.IS_NOT_EMPTY('인가 코드'),
  })
  authorizationCode: string;

  @ApiProperty({
    description: '토스 환경 (DEFAULT: 운영, SANDBOX: 테스트)',
    enum: TossReferrer,
    example: TossReferrer.DEFAULT,
  })
  @IsEnum(TossReferrer, {
    message: ERROR_MESSAGES.VALIDATION.INVALID_ENUM(
      'referrer',
      Object.values(TossReferrer).join(', '),
    ),
  })
  @IsNotEmpty({
    message: ERROR_MESSAGES.VALIDATION.IS_NOT_EMPTY('referrer'),
  })
  referrer: TossReferrer;
}
