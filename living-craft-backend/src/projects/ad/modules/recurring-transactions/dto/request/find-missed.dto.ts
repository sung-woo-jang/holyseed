import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class FindMissedDto {
  @ApiPropertyOptional({ description: '탐지 시작 날짜 (YYYY-MM-DD, 없으면 시작일 이후 전체)', example: '2026-04-01' })
  @IsOptional()
  @IsDateString({}, { message: '탐지 시작 날짜는 YYYY-MM-DD 형식이어야 합니다.' })
  fromDate?: string;
}
