import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { FridgeHousehold } from './household.entity';

export type FridgePlace = '냉장' | '냉동' | '실온';

@Entity('freq_items', { schema: 'fridge' })
@Unique(['householdId', 'name'])
export class FridgeFreqItem extends BaseEntity {
  @Column({ name: 'household_id', type: 'int' })
  householdId: number;

  @ManyToOne(() => FridgeHousehold, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'household_id' })
  household?: FridgeHousehold;

  @Column({ length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 10 })
  place: FridgePlace;

  @Column({ type: 'int' })
  days: number;
}
