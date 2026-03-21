import { IsNumber, IsNotEmpty, IsEnum, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ERROR_MESSAGES, FIELD_NAMES } from '@common/constants';
import { TimeType } from './available-times.dto';

export class AvailableDatesDto {
  @ApiProperty({
    description: '서비스 ID',
    example: 1,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber(
    {},
    {
      message: ERROR_MESSAGES.VALIDATION.IS_NUMBER(FIELD_NAMES.serviceId),
    },
  )
  @IsNotEmpty({
    message: ERROR_MESSAGES.VALIDATION.IS_NOT_EMPTY(FIELD_NAMES.serviceId),
  })
  serviceId: number;

  @ApiProperty({
    description: '조회 연도',
    example: 2024,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber(
    {},
    {
      message: ERROR_MESSAGES.VALIDATION.IS_NUMBER('연도'),
    },
  )
  @Min(2024, { message: '연도는 2024 이상이어야 합니다.' })
  @Max(2100, { message: '연도는 2100 이하이어야 합니다.' })
  year: number;

  @ApiProperty({
    description: '조회 월 (1-12)',
    example: 1,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber(
    {},
    {
      message: ERROR_MESSAGES.VALIDATION.IS_NUMBER('월'),
    },
  )
  @Min(1, { message: '월은 1 이상이어야 합니다.' })
  @Max(12, { message: '월은 12 이하이어야 합니다.' })
  month: number;

  @ApiProperty({
    description: '시간 타입 (견적/시공)',
    enum: TimeType,
    example: TimeType.ESTIMATE,
  })
  @IsEnum(TimeType, {
    message: ERROR_MESSAGES.VALIDATION.INVALID_ENUM(
      '시간 타입',
      Object.values(TimeType).join(', '),
    ),
  })
  @IsNotEmpty({
    message: ERROR_MESSAGES.VALIDATION.IS_NOT_EMPTY('시간 타입'),
  })
  type: TimeType;
}
