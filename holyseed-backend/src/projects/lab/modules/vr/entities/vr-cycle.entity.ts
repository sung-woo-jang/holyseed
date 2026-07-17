import { Column, Entity } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { numeric } from '../../../common/numeric.transformer';

@Entity('vr_cycles', { schema: 'lab' })
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
}
