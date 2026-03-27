import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationRequestDto } from '@common/dto/request/pagination-request.dto';
import { UserRole, UserStatus } from '@common/enums';
import { ERROR_MESSAGES, FIELD_NAMES } from '@common/constants';

export class UsersQueryDto extends PaginationRequestDto {
  @ApiPropertyOptional({
    description: '검색어 (이름, 이메일, 사용자명)',
    example: 'hong',
  })
  @IsOptional()
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING('검색어'),
  })
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({
    description: '역할 필터',
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
    description: '상태 필터',
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
