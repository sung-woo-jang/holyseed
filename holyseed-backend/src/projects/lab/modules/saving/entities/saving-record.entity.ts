import { Column, Entity } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { numeric } from '../../../common/numeric.transformer';

@Entity('saving_records', { schema: 'lab' })
export class SavingRecord extends BaseEntity {
  @ApiProperty({ description: '연월', example: '2026-07' })
  @Column({ name: 'year_month', length: 7, unique: true })
  yearMonth: string;

  @ApiProperty({ description: '월 실수령 수입 합산 (원)', example: 3200000 })
  @Column({ type: 'int' })
  income: number;

  @ApiProperty({ description: '적용 저축률 (%)', example: 60 })
  @Column({ name: 'saving_rate', type: 'decimal', precision: 5, scale: 2, transformer: numeric })
  savingRate: number;

  @ApiProperty({ description: '투자 목표액 (원)', example: 1920000 })
  @Column({ name: 'saving_target', type: 'int' })
  savingTarget: number;

  @ApiProperty({ description: '소비 한도 (원)', example: 1280000 })
  @Column({ name: 'spending_limit', type: 'int' })
  spendingLimit: number;

  @ApiPropertyOptional({ description: '실제 저축액 (원)', example: null })
  @Column({ name: 'actual_saving', type: 'int', nullable: true })
  actualSaving: number | null;

  @ApiPropertyOptional({ description: '메모' })
  @Column({ type: 'text', nullable: true })
  memo: string | null;
}
