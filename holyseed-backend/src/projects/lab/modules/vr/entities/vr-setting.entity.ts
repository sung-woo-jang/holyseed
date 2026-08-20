import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { numeric } from '../../../common/numeric.transformer';

@Entity('vr_settings', { schema: 'lab' })
export class VrSetting extends BaseEntity {
  @ApiProperty({ description: '종목', example: 'TQQQ' })
  @Column({ length: 20, default: 'TQQQ' })
  symbol: string;

  @ApiProperty({ description: 'G (기울기)', example: 10 })
  @Column({ name: 'g_factor', type: 'int', default: 10 })
  gFactor: number;

  @ApiProperty({ description: '밴드 (%)', example: 15 })
  @Column({ name: 'band_pct', type: 'decimal', precision: 5, scale: 2, default: 15, transformer: numeric })
  bandPct: number;

  @ApiProperty({ description: '사이클당 적립금 ($)', example: 200 })
  @Column({ name: 'deposit_amount', type: 'decimal', precision: 12, scale: 2, default: 200, transformer: numeric })
  depositAmount: number;

  @ApiProperty({ description: 'Pool 사용 한도 (%)', example: 75 })
  @Column({ name: 'pool_limit_pct', type: 'decimal', precision: 5, scale: 2, default: 75, transformer: numeric })
  poolLimitPct: number;

  @ApiProperty({ description: 'Overview 페이지 통계 카드 표시 순서 (카드 id 배열)', required: false, nullable: true })
  @Column({ name: 'card_order', type: 'jsonb', nullable: true })
  cardOrder: string[] | null;

  @ApiProperty({ description: 'Overview 페이지에서 숨긴 통계 카드 id 목록', required: false, nullable: true })
  @Column({ name: 'hidden_cards', type: 'jsonb', nullable: true })
  hiddenCards: string[] | null;
}
