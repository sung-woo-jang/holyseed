import { Column, Entity } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { numeric } from '../../../common/numeric.transformer';

@Entity('vr_cycles', { schema: 'ad' })
export class VrCycle extends BaseEntity {
  @ApiProperty({ description: '사이클 번호', example: 1 })
  @Column({ name: 'cycle_no', type: 'int', unique: true })
  cycleNo: number;

  @ApiProperty({ description: '시작일', example: '2026-06-22' })
  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @ApiProperty({ description: '종료일 (2주 후 금요일)', example: '2026-07-03' })
  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @ApiProperty({ description: 'V 값', example: 1322.96 })
  @Column({ name: 'v_value', type: 'decimal', precision: 14, scale: 2, transformer: numeric })
  vValue: number;

  @ApiProperty({ description: '사이클 시작 시 Pool', example: 4600 })
  @Column({ name: 'pool_start', type: 'decimal', precision: 14, scale: 2, transformer: numeric })
  poolStart: number;

  @ApiPropertyOptional({ description: '사이클 종료 시 Pool' })
  @Column({ name: 'pool_end', type: 'decimal', precision: 14, scale: 2, nullable: true, transformer: numeric })
  poolEnd: number | null;

  @ApiProperty({ description: '적립금', example: 200 })
  @Column({ name: 'deposit_amount', type: 'decimal', precision: 12, scale: 2, default: 200, transformer: numeric })
  depositAmount: number;

  @ApiProperty({ description: '종료 여부', example: false })
  @Column({ name: 'is_closed', default: false })
  isClosed: boolean;

  @ApiPropertyOptional({ description: 'V 산출 입력: 직전 사이클 V(V₁)' })
  @Column({ name: 'prev_v_value', type: 'decimal', precision: 14, scale: 2, nullable: true, transformer: numeric })
  prevVValue: number | null;

  @ApiPropertyOptional({ description: 'V 산출 입력: 갱신 시점 Pool (적립 전)' })
  @Column({ name: 'pool_input', type: 'decimal', precision: 14, scale: 2, nullable: true, transformer: numeric })
  poolInput: number | null;

  @ApiPropertyOptional({ description: 'V 산출 입력: 마지막 평가금 E (실력공식). 없으면 기본공식으로 계산한 사이클' })
  @Column({ name: 'evaluation_input', type: 'decimal', precision: 14, scale: 2, nullable: true, transformer: numeric })
  evaluationInput: number | null;

  @ApiPropertyOptional({ description: 'V 산출에 적용한 G' })
  @Column({ name: 'g_factor', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: numeric })
  gFactor: number | null;

  @ApiPropertyOptional({ description: 'V 산출 시점 밴드 % (기록용)' })
  @Column({ name: 'band_pct', type: 'decimal', precision: 6, scale: 2, nullable: true, transformer: numeric })
  bandPct: number | null;

  @ApiPropertyOptional({ description: 'V 출처: ROLLOVER(갱신) | MANUAL(직접 입력) | BACKFILL(역산 추정)' })
  @Column({ name: 'calc_source', type: 'varchar', length: 12, nullable: true })
  calcSource: 'ROLLOVER' | 'MANUAL' | 'BACKFILL' | null;

  @ApiPropertyOptional({ description: 'V 갱신 실행 시각' })
  @Column({ name: 'rolled_at', type: 'timestamptz', nullable: true })
  rolledAt: Date | null;
}
