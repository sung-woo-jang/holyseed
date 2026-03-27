import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ERROR_MESSAGES, FIELD_NAMES } from '@common/constants';

export class ReviewsQueryDto {
  @ApiPropertyOptional({
    description: '평점 필터 (1-5)',
    example: 5,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber(
    {},
    {
      message: ERROR_MESSAGES.VALIDATION.IS_NUMBER(FIELD_NAMES.rating),
    },
  )
  @Min(1, {
    message: ERROR_MESSAGES.VALIDATION.MIN(FIELD_NAMES.rating, 1),
  })
  @Max(5, {
    message: ERROR_MESSAGES.VALIDATION.MAX(FIELD_NAMES.rating, 5),
  })
  rating?: number;

  @ApiPropertyOptional({
    description: '서비스 ID 필터',
    example: '1',
  })
  @IsOptional()
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.serviceId),
  })
  serviceId?: string;

  @ApiPropertyOptional({
    description: '조회 개수',
    example: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;

  @ApiPropertyOptional({
    description: '건너뛸 개수',
    example: 0,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  offset?: number = 0;
}
