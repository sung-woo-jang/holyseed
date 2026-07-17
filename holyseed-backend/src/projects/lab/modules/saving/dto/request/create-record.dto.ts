import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

export class CreateRecordDto {
  @ApiProperty({ description: '연월 (YYYY-MM)', example: '2026-07' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: '연월은 YYYY-MM 형식이어야 합니다.' })
  yearMonth: string;

  @ApiProperty({ description: '월 실수령 수입 합산 (원)', example: 3200000 })
  @IsInt()
  @Min(0)
  income: number;

  @ApiPropertyOptional({ description: '실제 저축액 (원)' })
  @IsOptional()
  @IsInt()
  actualSaving?: number | null;

  @ApiPropertyOptional({ description: '메모' })
  @IsOptional()
  @IsString()
  memo?: string;
}
