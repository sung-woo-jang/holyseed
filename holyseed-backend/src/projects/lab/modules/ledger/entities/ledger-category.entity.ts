import { Column, Entity } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';

export enum LedgerType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum LedgerCostType {
  FIXED = 'FIXED',
  VARIABLE = 'VARIABLE',
}

@Entity('ledger_categories', { schema: 'lab' })
export class LedgerCategory extends BaseEntity {
  @ApiProperty({ description: '카테고리명', example: '주거비' })
  @Column({ length: 50 })
  name: string;

  @ApiProperty({ description: '아이콘 (이모지)', example: '🏠' })
  @Column({ length: 10 })
  icon: string;

  @ApiProperty({ description: '색상 (hex)', example: '#F59E0B' })
  @Column({ length: 20 })
  color: string;

  @ApiProperty({ description: '수입/지출 구분', enum: LedgerType })
  @Column({ type: 'enum', enum: LedgerType, enumName: 'lab_ledger_type' })
  type: LedgerType;

  @ApiPropertyOptional({ description: '기본 분류 (고정비/변동비, 지출만 해당)', enum: LedgerCostType })
  @Column({ name: 'cost_type', type: 'enum', enum: LedgerCostType, enumName: 'lab_ledger_cost_type', nullable: true })
  costType: LedgerCostType | null;
}
