import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

export enum MemberRole {
  OWNER = 'OWNER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

@Entity('memberships', { schema: 'ad' })
@Index(['householdId', 'userId'], { unique: true })
export class Membership extends BaseEntity {
  @Column({ name: 'household_id' })
  householdId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'enum', enum: MemberRole, default: MemberRole.VIEWER })
  role: MemberRole;

  @Column({ name: 'invited_at', type: 'timestamp', nullable: true })
  invitedAt: Date;

  @Column({ name: 'joined_at', type: 'timestamp', nullable: true })
  joinedAt: Date;

  @Column({ name: 'invited_by_user_id', nullable: true })
  invitedByUserId: number;
}
