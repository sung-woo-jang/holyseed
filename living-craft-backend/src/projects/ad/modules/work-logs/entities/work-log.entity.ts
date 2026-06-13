import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('work_logs', { schema: 'ad' })
@Index(['householdId', 'date'])
export class WorkLog extends BaseEntity {
  @Column({ name: 'household_id' })
  householdId: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  amount: number;

  /** 사용자가 자유롭게 의미를 부여하는 색상 표식 (hex 또는 라벨 키) */
  @Column({ name: 'color_label', length: 20, nullable: true })
  colorLabel: string;

  /** 수령 여부 — true이면 INCOME 거래가 생성되어 자산에 반영됨 */
  @Column({ default: false })
  settled: boolean;

  /** 수령 처리 시 생성된 거래 ID (정합성 유지용) */
  @Column({ name: 'settled_transaction_id', nullable: true })
  settledTransactionId: number;

  @Column({ name: 'work_minutes', nullable: true })
  workMinutes: number;

  @Column({ name: 'hourly_rate', type: 'decimal', precision: 12, scale: 2, nullable: true })
  hourlyRate: number;

  /** 수령 시 입금될 자산 */
  @Column({ name: 'to_asset_id', nullable: true })
  toAssetId: number;

  @Column({ name: 'category_id', nullable: true })
  categoryId: number;

  @Column({ type: 'text', nullable: true })
  memo: string;

  @Column({ name: 'created_by_user_id', nullable: true })
  createdByUserId: number;
}
