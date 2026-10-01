import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { FridgeHousehold } from './household.entity';

/** 캘린더 "누구 일정" 라벨 — 로그인 계정과 별개 (아이 등 포함) */
@Entity('people', { schema: 'fridge' })
export class FridgePerson extends BaseEntity {
  @Column({ name: 'household_id', type: 'int' })
  householdId: number;

  @ManyToOne(() => FridgeHousehold, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'household_id' })
  household?: FridgeHousehold;

  @Column({ length: 30 })
  name: string;

  @Column({ length: 40 })
  color: string;
}
