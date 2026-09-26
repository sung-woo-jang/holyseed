import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class CloseInvestmentDto {
  @ApiPropertyOptional({ description: '종료일 — 비우면 오늘 날짜', example: '2026-09-26' })
  @IsOptional()
  @IsDateString({}, { message: '종료일은 YYYY-MM-DD 형식이어야 합니다.' })
  date?: string;
}
