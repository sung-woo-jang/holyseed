import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { FridgeHousehold } from './household.entity';
import { FridgeUser } from './user.entity';

export type FridgeRole = 'OWNER' | 'MEMBER';

@Entity('household_members', { schema: 'fridge' })
export class FridgeHouseholdMember extends BaseEntity {
  @Column({ name: 'household_id', type: 'int' })
  householdId: number;

  @ManyToOne(() => FridgeHousehold, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'household_id' })
  household?: FridgeHousehold;

  /** 1인 1가구 */
  @Column({ name: 'user_id', type: 'int', unique: true })
  userId: number;

  @ManyToOne(() => FridgeUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: FridgeUser;

  @Column({ type: 'varchar', length: 10, default: 'MEMBER' })
  role: FridgeRole;
}
