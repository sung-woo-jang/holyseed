import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class UpsertSnapshotDto {
  @ApiProperty({ description: '날짜 (YYYY-MM-DD)', example: '2024-01-31' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: '자산 평가액 (자산 통화 기준)', example: 5000000 })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional({ description: '원화 환율 (기본 1)', example: 1 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  fxRateToKRW?: number;

  @ApiPropertyOptional({ description: '메모' })
  @IsOptional()
  @IsString()
  note?: string;
}
