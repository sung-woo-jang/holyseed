import { IsString, IsNotEmpty, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ERROR_MESSAGES, FIELD_NAMES } from '@common/constants';

export class AddHolidayDto {
  @ApiProperty({
    description: '휴무일 (YYYY-MM-DD)',
    example: '2024-01-01',
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
    description: '휴무 사유',
    example: '신정',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING('휴무 사유'),
  })
  @IsNotEmpty({
    message: ERROR_MESSAGES.VALIDATION.IS_NOT_EMPTY('휴무 사유'),
  })
  @MaxLength(200, {
    message: ERROR_MESSAGES.VALIDATION.MAX_LENGTH('휴무 사유', 200),
  })
  reason: string;
}
