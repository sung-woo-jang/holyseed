import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export class UpsertDcaPlanDto {
  @ApiProperty({ description: '종목 (토스 심볼)', example: 'UPRO' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @Matches(/^[A-Z0-9.]{1,10}$/, { message: '종목은 영문 대문자·숫자 10자 이내여야 합니다.' })
  symbol: string;

  @ApiPropertyOptional({ description: '화면에 보일 이름', example: 'UPRO' })
  @IsOptional()
  @IsString()
  @MaxLength(30, { message: '이름은 30자를 넘을 수 없습니다.' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({ description: '1회 매수 금액 ($)', example: 1 })
  @IsOptional()
  @IsNumber({}, { message: '금액은 숫자여야 합니다.' })
  @Min(0, { message: '금액은 0 이상이어야 합니다.' })
  dailyAmount?: number;

  @ApiPropertyOptional({ description: '모으기 시작일 — 이 날 이후 체결만 기록', example: '2026-10-12' })
  @IsOptional()
  @IsDateString({}, { message: '시작일은 YYYY-MM-DD 형식이어야 합니다.' })
  startDate?: string;
}
