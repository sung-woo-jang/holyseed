import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class SearchScheduleDto {
  @ApiProperty({ description: '조회 시작 (ISO 8601)', example: '2026-07-01T00:00:00+09:00' })
  @IsDateString()
  from: string;

  @ApiProperty({ description: '조회 끝 (ISO 8601)', example: '2026-07-31T23:59:59+09:00' })
  @IsDateString()
  to: string;
}
