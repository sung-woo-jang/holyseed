import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const BACKTEST_SYMBOLS = ['TQQQ', 'QLD', 'SSO', 'UPRO', 'SOXL', 'QQQM', 'SPYM'] as const;
export type BacktestSymbol = (typeof BACKTEST_SYMBOLS)[number];

export class GetPricesDto {
  @ApiProperty({ description: '종목', enum: BACKTEST_SYMBOLS, example: 'TQQQ' })
  @IsIn(BACKTEST_SYMBOLS, { message: `종목은 ${BACKTEST_SYMBOLS.join('/')} 중 하나여야 합니다.` })
  symbol: BacktestSymbol;

  @ApiProperty({ description: '조회할 연수', example: 10, minimum: 1, maximum: 15 })
  @IsInt({ message: '연수는 정수여야 합니다.' })
  @Min(1)
  @Max(15)
  years: number;

  @ApiPropertyOptional({ description: '투자 종료 시점(YYYY-MM-DD) — 생략 시 오늘까지', example: '2020-01-01' })
  @IsOptional()
  @IsDateString({}, { message: '종료일은 YYYY-MM-DD 형식이어야 합니다.' })
  untilDate?: string;
}
