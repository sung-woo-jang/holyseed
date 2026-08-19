import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PayStatus } from '../../entities';

export class QueryWorklogDto {
  @ApiPropertyOptional({ description: '연도 (from/to 없을 때 사용, 기본 올해)', example: 2026 })
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ description: '월 1~12 (from/to 없을 때 사용, 기본 이번 달)', example: 8 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({
    description: '조회 시작일 (YYYY-MM-DD) — 지정하면 year/month보다 우선',
    example: '2026-07-20',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: '조회 종료일 (YYYY-MM-DD) — from만 있으면 오늘까지', example: '2026-08-05' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: '분류 필터', example: '쿠팡' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiPropertyOptional({ description: '수령여부 필터', enum: PayStatus })
  @IsOptional()
  @IsEnum(PayStatus)
  payStatus?: PayStatus;

  @ApiPropertyOptional({ description: '이 업무 중 하나라도 포함된 기록만', example: ['필름'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  jobs?: string[];

  @ApiPropertyOptional({ description: '현장명 부분 검색', example: '송도' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  titleContains?: string;

  @ApiPropertyOptional({
    description:
      '원천징수(3.3%) 적용 여부. false면 응답에서 netAmount 및 집계의 totalNet/receivedNet/pendingNet을 제외하고 세전 금액(amount/effectiveAmount)만 반환. 기본 true',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  withholding?: boolean;
}
