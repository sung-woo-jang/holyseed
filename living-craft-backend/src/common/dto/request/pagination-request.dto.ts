import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ERROR_MESSAGES, FIELD_NAMES } from '@common/constants';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PaginationRequestDto {
  @ApiPropertyOptional({
    description: '페이지 번호 (1부터 시작)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: ERROR_MESSAGES.VALIDATION.IS_NUMBER(FIELD_NAMES.page),
  })
  @Min(1, {
    message: ERROR_MESSAGES.VALIDATION.MIN(FIELD_NAMES.page, 1),
  })
  page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지당 아이템 수',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: ERROR_MESSAGES.VALIDATION.IS_NUMBER(FIELD_NAMES.limit),
  })
  @Min(1, {
    message: ERROR_MESSAGES.VALIDATION.MIN(FIELD_NAMES.limit, 1),
  })
  @Max(100, {
    message: ERROR_MESSAGES.VALIDATION.MAX(FIELD_NAMES.limit, 100),
  })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: '정렬 기준 필드',
    example: 'createdAt',
  })
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    description: '정렬 순서',
    enum: SortOrder,
    example: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder, {
    message: ERROR_MESSAGES.VALIDATION.INVALID_ENUM(
      FIELD_NAMES.sortOrder,
      Object.values(SortOrder).join(', '),
    ),
  })
  sortOrder?: SortOrder = SortOrder.DESC;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }

  get take(): number {
    return this.limit;
  }
}
