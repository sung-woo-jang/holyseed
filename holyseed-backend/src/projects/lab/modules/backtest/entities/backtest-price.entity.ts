import { Column, Entity, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { numeric } from '../../../common/numeric.transformer';

/** 백테스트용 일봉 종가 캐시 — 토스 API에서 한 번 받아온 뒤 재사용 (symbol, date) 유니크 */
@Entity('backtest_prices', { schema: 'lab' })
@Index(['symbol', 'date'], { unique: true })
export class BacktestPrice extends BaseEntity {
  @ApiProperty({ description: '종목', example: 'TQQQ' })
  @Column({ type: 'varchar', length: 16 })
  symbol: string;

  @ApiProperty({ description: '날짜', example: '2026-08-25' })
  @Column({ type: 'date' })
  date: string;

  @ApiProperty({ description: '종가(수정주가) ($)', example: 70.68 })
  @Column({ type: 'decimal', precision: 12, scale: 4, transformer: numeric })
  close: number;
}
