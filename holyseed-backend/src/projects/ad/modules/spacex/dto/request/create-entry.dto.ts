import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSpacexEntryDto {
  @ApiPropertyOptional({ description: '종목 — 비우면 SPCX(스페이스X)', example: 'UPRO' })
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiProperty({ description: '기록 날짜', example: '2026-09-26' })
  @IsDateString({}, { message: '날짜는 YYYY-MM-DD 형식이어야 합니다.' })
  date: string;

  @ApiProperty({
    description: '원금 증감액 ($) — 실제 체결금액을 정밀하게(소수점 이하까지) 넣을 것',
    example: 1.999965,
  })
  @IsNumber({}, { message: '금액은 숫자여야 합니다.' })
  amount: number;

  @ApiPropertyOptional({ description: '체결가 ($) — 모르면 비움', example: 208.4 })
  @IsOptional()
  @IsNumber({}, { message: '체결가는 숫자여야 합니다.' })
  price?: number;

  @ApiPropertyOptional({ description: '수량 — 비우면 price로 자동 계산', example: 0.0096 })
  @IsOptional()
  @IsNumber({}, { message: '수량은 숫자여야 합니다.' })
  quantity?: number;

  @ApiPropertyOptional({ description: '리밸런싱 표시 여부', default: false })
  @IsOptional()
  @IsBoolean()
  isRebalance?: boolean;

  @ApiPropertyOptional({ description: '자유 메모' })
  @IsOptional()
  @IsString()
  note?: string;
}
