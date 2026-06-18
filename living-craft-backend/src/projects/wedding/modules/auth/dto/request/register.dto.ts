import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class WeddingRegisterDto {
  @ApiProperty({ description: '관리자 이메일', example: 'admin@example.com' })
  @IsEmail({}, { message: '유효한 이메일 형식이어야 합니다.' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty({ description: '비밀번호 (최소 6자)', minLength: 6 })
  @IsString()
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  password: string;

  @ApiProperty({ description: '신랑 이름', example: '성우' })
  @IsString()
  @MaxLength(50, { message: '신랑 이름은 50자를 초과할 수 없습니다.' })
  @Transform(({ value }) => value?.trim())
  groomName: string;

  @ApiProperty({ description: '신부 이름', example: '민지' })
  @IsString()
  @MaxLength(50, { message: '신부 이름은 50자를 초과할 수 없습니다.' })
  @Transform(({ value }) => value?.trim())
  brideName: string;

  @ApiProperty({ description: 'URL slug (소문자, 숫자, 하이픈)', example: 'sungwoo-minji' })
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, { message: 'slug는 소문자, 숫자, 하이픈(-)만 사용 가능합니다.' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  slug: string;
}
