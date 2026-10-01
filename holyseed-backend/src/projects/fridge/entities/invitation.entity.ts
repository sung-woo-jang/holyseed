import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { FridgeHousehold } from './household.entity';

@Entity('invitations', { schema: 'fridge' })
export class FridgeInvitation extends BaseEntity {
  @Column({ name: 'household_id', type: 'int' })
  householdId: number;

  @ManyToOne(() => FridgeHousehold, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'household_id' })
  household?: FridgeHousehold;

  @Column({ length: 16, unique: true })
  code: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt: Date | null;

  @Column({ name: 'created_by_user_id', type: 'int' })
  createdByUserId: number;
}
