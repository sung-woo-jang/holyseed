import { IsString, IsNotEmpty, IsEnum, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ERROR_MESSAGES, FIELD_NAMES } from '@common/constants';

export enum TimeType {
  ESTIMATE = 'estimate',
  CONSTRUCTION = 'construction',
}

export class AvailableTimesDto {
  @ApiProperty({
    description: '서비스 ID',
    example: '1',
  })
  @Transform(({ value }) => String(value))
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.serviceId),
  })
  @IsNotEmpty({
    message: ERROR_MESSAGES.VALIDATION.IS_NOT_EMPTY(FIELD_NAMES.serviceId),
  })
  serviceId: string;

  @ApiProperty({
    description: '조회 날짜 (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.date),
  })
  @IsNotEmpty({
    message: ERROR_MESSAGES.VALIDATION.IS_NOT_EMPTY(FIELD_NAMES.date),
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: ERROR_MESSAGES.VALIDATION.INVALID_DATE_FORMAT,
  })
  date: string;

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
