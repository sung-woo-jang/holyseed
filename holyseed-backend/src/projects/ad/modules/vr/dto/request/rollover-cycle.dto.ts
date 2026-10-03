import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional } from 'class-validator';

export class RolloverCycleDto {
  @ApiPropertyOptional({ description: '새 사이클 시작일 (기본: 현 사이클 종료 다음 월요일)', example: '2026-07-06' })
  @IsOptional()
  @IsDateString()
  newStartDate?: string;

  @ApiPropertyOptional({ description: '적립금 (기본: 설정값)', example: 200 })
  @IsOptional()
  @IsNumber()
  deposit?: number;

  @ApiPropertyOptional({
    description: '마지막 평가금 E (기본: 보유수량 × 사이클 종료일 종가 — 종료 전이면 현재가)',
    example: 4924.8,
  })
  @IsOptional()
  @IsNumber()
  lastEvaluation?: number;
}
