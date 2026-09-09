import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { LedgerType } from '../../entities';

export class CreateTransactionDto {
  @ApiProperty({ description: '날짜', example: '2026-09-15' })
  @IsDateString({}, { message: '날짜는 YYYY-MM-DD 형식이어야 합니다.' })
  date: string;

  @ApiProperty({ description: '수입/지출 구분', enum: LedgerType })
  @IsEnum(LedgerType)
  type: LedgerType;

  @ApiProperty({ description: '금액 (원)', example: 55000 })
  @IsInt()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: '카테고리 ID' })
  @IsOptional()
  @IsInt()
  categoryId?: number | null;

  @ApiPropertyOptional({ description: '연결 자산 ID (선택)' })
  @IsOptional()
  @IsInt()
  assetId?: number | null;

  @ApiPropertyOptional({ description: '제목' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: '메모' })
  @IsOptional()
  @IsString()
  memo?: string;
}
