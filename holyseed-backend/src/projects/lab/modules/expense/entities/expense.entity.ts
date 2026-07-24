import { Column, Entity } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';

export enum ExpenseKind {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
}

export enum ExpenseType {
  FIXED_SAME = 'FIXED_SAME',
  FIXED_VARIABLE = 'FIXED_VARIABLE',
  IRREGULAR = 'IRREGULAR',
}

@Entity('expenses', { schema: 'lab' })
export class Expense extends BaseEntity {
  @ApiProperty({ description: '항목', example: '월세' })
  @Column({ length: 200 })
  title: string;

  @ApiProperty({ description: '날짜', example: '2026-06-27' })
  @Column({ type: 'date' })
  date: string;

  @ApiProperty({ description: '구분', enum: ExpenseKind })
  @Column({ type: 'enum', enum: ExpenseKind, enumName: 'lab_expense_kind' })
  kind: ExpenseKind;

  @ApiProperty({ description: '분류', example: '주거' })
  @Column({ length: 50 })
  category: string;

  @ApiPropertyOptional({ description: '지출유형 (수입은 null)', enum: ExpenseType })
  @Column({ name: 'expense_type', type: 'enum', enum: ExpenseType, enumName: 'lab_expense_type', nullable: true })
  expenseType: ExpenseType | null;

  @ApiProperty({ description: '금액 (원)', example: 500000 })
  @Column({ type: 'int' })
  amount: number;

  @ApiPropertyOptional({ description: '메모' })
  @Column({ type: 'text', nullable: true })
  memo: string | null;
}
