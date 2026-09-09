import { Column, Entity } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { LedgerType } from './ledger-category.entity';

@Entity('ledger_transactions', { schema: 'lab' })
export class LedgerTransaction extends BaseEntity {
  @ApiProperty({ description: '날짜', example: '2026-09-15' })
  @Column({ type: 'date' })
  date: string;

  @ApiProperty({ description: '수입/지출 구분', enum: LedgerType })
  @Column({ type: 'enum', enum: LedgerType, enumName: 'lab_ledger_type' })
  type: LedgerType;

  @ApiProperty({ description: '금액 (원)', example: 55000 })
  @Column({ type: 'int' })
  amount: number;

  @ApiPropertyOptional({ description: '카테고리 ID' })
  @Column({ name: 'category_id', type: 'int', nullable: true })
  categoryId: number | null;

  @ApiPropertyOptional({ description: '연결 자산 ID (선택)' })
  @Column({ name: 'asset_id', type: 'int', nullable: true })
  assetId: number | null;

  @ApiPropertyOptional({ description: '제목' })
  @Column({ length: 200, nullable: true })
  title: string | null;

  @ApiPropertyOptional({ description: '메모' })
  @Column({ type: 'text', nullable: true })
  memo: string | null;
}
