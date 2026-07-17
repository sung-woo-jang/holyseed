import { Column, Entity } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { numeric } from '../../../common/numeric.transformer';

export enum VrFillKind {
  INITIAL_BUY = 'INITIAL_BUY',
  BUY = 'BUY',
  SELL = 'SELL',
  /** 적립금 입금 — 수량 0, price=입금액, Pool만 증가 */
  DEPOSIT = 'DEPOSIT',
}

@Entity('vr_fills', { schema: 'lab' })
export class VrFill extends BaseEntity {
  @ApiProperty({ description: '체결일', example: '2026-06-22' })
  @Column({ name: 'fill_date', type: 'date' })
  fillDate: string;

  @ApiProperty({ description: '구분', enum: VrFillKind })
  @Column({ type: 'enum', enum: VrFillKind, enumName: 'lab_vr_fill_kind' })
  kind: VrFillKind;

  @ApiProperty({ description: '체결가 ($)', example: 84.43 })
  @Column({ type: 'decimal', precision: 12, scale: 4, transformer: numeric })
  price: number;

  @ApiProperty({ description: '수량', example: 6 })
  @Column({ type: 'int' })
  quantity: number;

  @ApiProperty({ description: '체결금액 ($)', example: 506.58 })
  @Column({ type: 'decimal', precision: 14, scale: 2, transformer: numeric })
  amount: number;

  @ApiProperty({ description: 'Pool 변화 (매수 -, 매도 +)', example: -506.58 })
  @Column({ name: 'pool_change', type: 'decimal', precision: 14, scale: 2, transformer: numeric })
  poolChange: number;

  @ApiProperty({ description: '변화 후 Pool', example: 4093.42 })
  @Column({ name: 'pool_after', type: 'decimal', precision: 14, scale: 2, transformer: numeric })
  poolAfter: number;

  @ApiProperty({ description: '변화 후 보유수량', example: 14 })
  @Column({ name: 'qty_after', type: 'int' })
  qtyAfter: number;

  @ApiProperty({ description: '변화 후 평단', example: 80.3 })
  @Column({ name: 'avg_price_after', type: 'decimal', precision: 12, scale: 4, transformer: numeric })
  avgPriceAfter: number;

  @ApiProperty({ description: '사이클 번호', example: 1 })
  @Column({ name: 'cycle_no', type: 'int' })
  cycleNo: number;

  @ApiPropertyOptional({ description: '메모' })
  @Column({ type: 'text', nullable: true })
  note: string | null;
}
