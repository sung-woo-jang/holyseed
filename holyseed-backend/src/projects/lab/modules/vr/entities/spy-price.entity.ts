import { Column, Entity, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { numeric } from '../../../common/numeric.transformer';

/** SPY(S&P500 ETF) 일별 종가 — VR 누적 수익률을 베타(시장) 대비로 비교하기 위한 벤치마크 데이터. */
@Entity('spy_prices', { schema: 'lab' })
@Unique(['date'])
export class SpyPrice extends BaseEntity {
  @ApiProperty({ description: '거래일', example: '2026-06-22' })
  @Column({ length: 10 })
  date: string;

  @ApiProperty({ description: '종가 ($)', example: 545.32 })
  @Column({ name: 'close_price', type: 'decimal', precision: 12, scale: 4, transformer: numeric })
  closePrice: number;
}
