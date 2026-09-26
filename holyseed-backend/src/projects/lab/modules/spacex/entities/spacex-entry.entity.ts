import { Column, Entity } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { numeric } from '../../../common/numeric.transformer';

@Entity('spacex_entries', { schema: 'lab' })
export class SpacexEntry extends BaseEntity {
  @ApiProperty({ description: '기록 날짜', example: '2026-09-26' })
  @Column({ type: 'date' })
  date: string;

  @ApiProperty({ description: '원금 증감액 ($) — 평소 매수는 양수, 리밸런싱 출금이면 음수일 수 있음', example: 2.0 })
  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: numeric })
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
}
