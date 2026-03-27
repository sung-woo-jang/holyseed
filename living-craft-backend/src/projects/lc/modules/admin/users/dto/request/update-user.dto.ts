import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@common/enums';
import { ERROR_MESSAGES, FIELD_NAMES } from '@common/constants';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: '이름',
    example: '홍',
  })
  @IsOptional()
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.firstName),
  })
  @MaxLength(100, {
    message: ERROR_MESSAGES.VALIDATION.MAX_LENGTH(FIELD_NAMES.firstName, 100),
  })
  @Transform(({ value }) => value?.trim())
  firstName?: string;

  @ApiPropertyOptional({
    description: '성',
    example: '길동',
  })
  @IsOptional()
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.lastName),
  })
  @MaxLength(100, {
    message: ERROR_MESSAGES.VALIDATION.MAX_LENGTH(FIELD_NAMES.lastName, 100),
  })
  @Transform(({ value }) => value?.trim())
  lastName?: string;

  @ApiPropertyOptional({
    description: '사용자명',
    example: 'hong.gildong',
  })
  @IsOptional()
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.username),
  })
  @MaxLength(100, {
    message: ERROR_MESSAGES.VALIDATION.MAX_LENGTH(FIELD_NAMES.username, 100),
  })
  @Matches(/^[a-z0-9._-]+$/, {
    message: ERROR_MESSAGES.VALIDATION.USERNAME_FORMAT,
  })
  @Transform(({ value }) => value?.trim().toLowerCase())
  username?: string;

  @ApiPropertyOptional({
    description: '이메일',
    example: 'hong@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: ERROR_MESSAGES.VALIDATION.IS_EMAIL })
  @MaxLength(255, {
    message: ERROR_MESSAGES.VALIDATION.MAX_LENGTH(FIELD_NAMES.email, 255),
  })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email?: string;

  @ApiPropertyOptional({
    description: '비밀번호 (최소 8자)',
    example: 'NewPassword123!',
  })
  @IsOptional()
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.password),
  })
  @MinLength(8, {
    message: ERROR_MESSAGES.VALIDATION.MIN_LENGTH(FIELD_NAMES.password, 8),
  })
  password?: string;

  @ApiPropertyOptional({
    description: '전화번호',
    example: '010-1234-5678',
  })
  @IsOptional()
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.phoneNumber),
  })
  @MaxLength(20, {
    message: ERROR_MESSAGES.VALIDATION.MAX_LENGTH(FIELD_NAMES.phoneNumber, 20),
  })
  @Transform(({ value }) => value?.trim())
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: '사용자 역할',
    enum: UserRole,
    example: UserRole.ADMIN,
  })
  @IsOptional()
  @IsEnum(UserRole, {
    message: ERROR_MESSAGES.VALIDATION.INVALID_ENUM(
      FIELD_NAMES.role,
      Object.values(UserRole).join(', '),
    ),
  })
  role?: UserRole;

  @ApiPropertyOptional({
    description: '사용자 상태',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus, {
    message: ERROR_MESSAGES.VALIDATION.INVALID_ENUM(
      FIELD_NAMES.status,
      Object.values(UserStatus).join(', '),
    ),
  })
  status?: UserStatus;
}
