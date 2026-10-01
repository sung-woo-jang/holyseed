import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { FridgeHousehold } from './household.entity';
import { FridgePlace } from './freq-item.entity';

@Entity('ingredients', { schema: 'fridge' })
export class FridgeIngredient extends BaseEntity {
  @Index()
  @Column({ name: 'household_id', type: 'int' })
  householdId: number;

  @ManyToOne(() => FridgeHousehold, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'household_id' })
  household?: FridgeHousehold;

  @Column({ length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 10 })
  place: FridgePlace;

  /** 유통기한 YYYY-MM-DD */
  @Column({ type: 'date' })
  exp: string;
}
