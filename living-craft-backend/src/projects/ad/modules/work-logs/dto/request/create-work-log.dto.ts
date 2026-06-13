import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateWorkLogDto {
  @ApiProperty({ description: '근무 날짜 (YYYY-MM-DD)', example: '2026-06-13' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: '제목 (예: 회사출근, 알바)', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: '수입 금액', example: 100000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ description: '색상 표식 (hex 또는 라벨 키)', example: '#3182F6' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  colorLabel?: string;

  @ApiPropertyOptional({ description: '근무 시간(분)', example: 480 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  workMinutes?: number;

  @ApiPropertyOptional({ description: '시급', example: 12000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiPropertyOptional({ description: '수령 시 입금 자산 ID' })
  @IsOptional()
  @IsNumber()
  toAssetId?: number;

  @ApiPropertyOptional({ description: '카테고리 ID' })
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional({ description: '메모' })
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiPropertyOptional({ description: '생성 즉시 수령 처리 (거래 동반 생성)', default: false })
  @IsOptional()
  @IsBoolean()
  settled?: boolean;
}
