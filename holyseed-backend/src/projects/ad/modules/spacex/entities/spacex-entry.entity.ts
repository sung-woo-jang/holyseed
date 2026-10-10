import { Column, Entity, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { numeric } from '../../../common/numeric.transformer';

/**
 * 모으기(소수점 적립 매수) 기록 — 처음엔 스페이스X 전용이라 테이블 이름이 spacex_entries로 남아 있다.
 * symbol로 종목을 나누며, 종목 칸이 생기기 전 기록은 전부 SPCX다.
 */
@Entity('spacex_entries', { schema: 'ad' })
@Index(['symbol', 'date'])
export class SpacexEntry extends BaseEntity {
  @ApiProperty({ description: '종목 (SPCX, UPRO …)', example: 'SPCX' })
  @Column({ length: 10, default: 'SPCX' })
  symbol: string;

  @ApiProperty({ description: '기록 날짜', example: '2026-09-26' })
  @Column({ type: 'date' })
  date: string;

  @ApiProperty({
    description: '원금 증감액 ($) — 평소 매수는 양수, 리밸런싱 출금이면 음수일 수 있음',
    example: 1.999965,
  })
  @Column({ type: 'decimal', precision: 14, scale: 6, transformer: numeric })
  amount: number;

  @ApiPropertyOptional({ description: '체결가 ($) — 평단/수익률 계산 근거, 모르면 비움', example: 208.4 })
  @Column({ type: 'decimal', precision: 12, scale: 4, transformer: numeric, nullable: true })
  price: number | null;

  @ApiPropertyOptional({ description: '수량 — price가 있고 비워두면 amount/price로 자동 계산', example: 0.0096 })
  @Column({ type: 'decimal', precision: 16, scale: 8, transformer: numeric, nullable: true })
  quantity: number | null;

  @ApiProperty({ description: '리밸런싱 표시 여부', example: false })
  @Column({ name: 'is_rebalance', type: 'boolean', default: false })
  isRebalance: boolean;

  @ApiPropertyOptional({ description: '자유 메모' })
  @Column({ type: 'text', nullable: true })
  note: string | null;

  @ApiPropertyOptional({
    description: '토스 주문ID — 자동 동기화로 들어온 기록만 있음(중복 방지용), 수동/API 기록은 null',
  })
  @Column({ name: 'order_id', type: 'varchar', length: 255, nullable: true, unique: true })
  orderId: string | null;

  @ApiPropertyOptional({ description: '기록 날짜의 일봉 시가 ($) — 토스 일봉으로 자동 채움(완결된 날만)' })
  @Column({ name: 'day_open', type: 'decimal', precision: 12, scale: 4, transformer: numeric, nullable: true })
  dayOpen: number | null;

  @ApiPropertyOptional({ description: '기록 날짜의 일봉 고가 ($)' })
  @Column({ name: 'day_high', type: 'decimal', precision: 12, scale: 4, transformer: numeric, nullable: true })
  dayHigh: number | null;

  @ApiPropertyOptional({ description: '기록 날짜의 일봉 저가 ($)' })
  @Column({ name: 'day_low', type: 'decimal', precision: 12, scale: 4, transformer: numeric, nullable: true })
  dayLow: number | null;

  @ApiPropertyOptional({ description: '기록 날짜의 일봉 종가 ($)' })
  @Column({ name: 'day_close', type: 'decimal', precision: 12, scale: 4, transformer: numeric, nullable: true })
  dayClose: number | null;
}
