import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('users', { schema: 'lab' })
export class LabUser extends BaseEntity {
  @Column({ length: 200, unique: true })
  email: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash?: string;

  @Column({ length: 100, default: '사용자' })
  name: string;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ name: 'failed_login_count', type: 'int', default: 0 })
  failedLoginCount: number;

  @Column({ name: 'locked_until', type: 'timestamp', nullable: true })
  lockedUntil: Date | null;
}
