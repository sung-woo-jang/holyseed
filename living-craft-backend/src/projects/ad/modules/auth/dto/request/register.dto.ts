import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @ApiProperty({ description: '이메일', example: 'user@example.com' })
  @IsEmail({}, { message: '유효한 이메일 형식이어야 합니다.' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty({ description: '비밀번호 (최소 6자)', minLength: 6 })
  @IsString()
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  password: string;

  @ApiPropertyOptional({ description: '이름', example: '성우' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '이름은 100자를 초과할 수 없습니다.' })
  @Transform(({ value }) => value?.trim())
  name?: string;
}
