import { IsEmail, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ERROR_MESSAGES, FIELD_NAMES } from '@common/constants';

export class LoginRequestDto {
  @ApiProperty({
    description: '이메일',
    example: 'admin@example.com',
  })
  @IsEmail({}, { message: ERROR_MESSAGES.VALIDATION.IS_EMAIL })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty({
    description: '비밀번호',
    example: 'Password123!',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.password),
  })
  @MinLength(8, {
    message: ERROR_MESSAGES.VALIDATION.MIN_LENGTH(FIELD_NAMES.password, 8),
  })
  password: string;
}
