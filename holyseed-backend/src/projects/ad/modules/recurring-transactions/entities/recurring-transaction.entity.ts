import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { TransactionType } from '../../transactions/entities/transaction.entity';

export enum RecurringFrequency {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

@Entity('recurring_transactions', { schema: 'ad' })
export class RecurringTransaction extends BaseEntity {
  @Column({ name: 'household_id' })
  householdId: number;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  amount: number;

  @Column({ name: 'category_id', nullable: true })
  categoryId: number;

  @Column({ name: 'from_asset_id', nullable: true })
  fromAssetId: number;

  @Column({ name: 'to_asset_id', nullable: true })
  toAssetId: number;

  @Column({ length: 200, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  memo: string;

  @Column({ type: 'enum', enum: RecurringFrequency, default: RecurringFrequency.MONTHLY })
  frequency: RecurringFrequency;

  @Column({ name: 'day_of_month' })
  dayOfMonth: number;

  @Column({ name: 'month_of_year', nullable: true })
  monthOfYear: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: string;

  @Column({ default: true })
  active: boolean;

  @Column({ name: 'last_run_date', type: 'date', nullable: true })
  lastRunDate: string;
}
