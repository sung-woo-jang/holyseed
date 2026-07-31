import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

export enum AssetCategory {
  CASH = 'CASH',
  INVESTMENT = 'INVESTMENT',
  CRYPTO = 'CRYPTO',
  REAL_ASSET = 'REAL_ASSET',
  PENSION = 'PENSION',
  DEBT = 'DEBT',
}

@Entity('assets', { schema: 'ad' })
@Index(['householdId'])
export class Asset extends BaseEntity {
  @Column({ name: 'household_id' })
  householdId: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'enum', enum: AssetCategory })
  category: AssetCategory;

  @Column({ length: 10, default: 'KRW' })
  currency: string;

  @Column({ name: 'is_liability', default: false })
  isLiability: boolean;

  /** 이 자산을 개인적으로 소유한 멤버. null이면 공동 소유(가구 EDITOR 누구나 수정 가능) */
  @Column({ name: 'owner_user_id', nullable: true })
  ownerUserId: number | null;

  @Column({ type: 'text', nullable: true })
  memo: string;

  @Column({ name: 'archived_at', type: 'timestamp', nullable: true })
  archivedAt: Date;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}
