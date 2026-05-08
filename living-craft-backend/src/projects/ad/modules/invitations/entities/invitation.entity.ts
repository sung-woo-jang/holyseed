import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { MemberRole } from '../../memberships/entities/membership.entity';

@Entity('invitations', { schema: 'ad' })
export class Invitation extends BaseEntity {
  @Column({ name: 'household_id' })
  householdId: number;

  @Column({ type: 'enum', enum: MemberRole, default: MemberRole.EDITOR })
  role: MemberRole;

  @Column({ unique: true, length: 20 })
  code: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'created_by_user_id' })
  createdByUserId: number;

  @Column({ name: 'accepted_by_user_id', nullable: true })
  acceptedByUserId: number;

  @Column({ name: 'accepted_at', type: 'timestamp', nullable: true })
  acceptedAt: Date;
}
