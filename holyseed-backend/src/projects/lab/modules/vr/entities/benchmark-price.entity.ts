import { Column, Entity, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { numeric } from '../../../common/numeric.transformer';

/** VOO/QQQM/QLD 등 비교 벤치마크 일별 종가 — VR(TQQQ) 누적 수익률과 비교하기 위한 데이터. */
@Entity('benchmark_prices', { schema: 'lab' })
@Unique(['symbol', 'date'])
export class BenchmarkPrice extends BaseEntity {
  @ApiProperty({ description: '종목', example: 'VOO' })
  @Column({ length: 12 })
  symbol: string;

  @ApiProperty({ description: '거래일', example: '2026-06-22' })
  @Column({ length: 10 })
  date: string;

  @ApiProperty({ description: '종가 ($)', example: 545.32 })
  @Column({ name: 'close_price', type: 'decimal', precision: 12, scale: 4, transformer: numeric })
  closePrice: number;
}
