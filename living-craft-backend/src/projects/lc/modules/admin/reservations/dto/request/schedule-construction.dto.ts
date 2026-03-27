import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { ERROR_MESSAGES, FIELD_NAMES } from '@common/constants';

/**
 * 시공 일정 지정 DTO
 * 관리자가 견적 완료 후 시공 일정을 지정할 때 사용
 */
export class ScheduleConstructionDto {
  @ApiProperty({
    description: '시공 날짜 (YYYY-MM-DD)',
    example: '2024-01-20',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.constructionDate),
  })
  @IsNotEmpty({
    message: ERROR_MESSAGES.VALIDATION.IS_NOT_EMPTY(
      FIELD_NAMES.constructionDate,
    ),
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: ERROR_MESSAGES.VALIDATION.DATE_FORMAT(
      FIELD_NAMES.constructionDate,
    ),
  })
  constructionDate: string;

  @ApiPropertyOptional({
    description: '시공 시간 (HH:mm, 하루 종일 작업이면 생략 또는 null)',
    example: '09:00',
  })
  @IsOptional()
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.constructionTime),
  })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: ERROR_MESSAGES.VALIDATION.TIME_FORMAT(
      FIELD_NAMES.constructionTime,
    ),
  })
  constructionTime?: string | null;
}
