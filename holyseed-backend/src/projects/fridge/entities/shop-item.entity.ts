import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { FridgeHousehold } from './household.entity';

@Entity('shop_items', { schema: 'fridge' })
export class FridgeShopItem extends BaseEntity {
  @Index()
  @Column({ name: 'household_id', type: 'int' })
  householdId: number;

  @ManyToOne(() => FridgeHousehold, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'household_id' })
  household?: FridgeHousehold;

  @Column({ length: 50 })
  name: string;

  @Column({ type: 'boolean', default: false })
  done: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  note: string | null;
}
