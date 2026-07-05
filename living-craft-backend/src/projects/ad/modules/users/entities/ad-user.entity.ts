import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('users', { schema: 'ad' })
export class AdUser extends BaseEntity {
  @Column({ name: 'toss_user_key', unique: true, nullable: true })
  tossUserKey: string | null;

  @Column({ length: 200, unique: true, nullable: true })
  email: string | null;

  @Column({ name: 'google_id', unique: true, nullable: true })
  googleId: string | null;

  @Column({ name: 'naver_id', unique: true, nullable: true })
  naverId: string | null;

  @Column({ name: 'password_hash', nullable: true, select: false })
  passwordHash?: string | null;

  @Column({ length: 100, default: '사용자' })
  name: string;

  @Column({ length: 5, nullable: true })
  initial: string;

  @Column({ name: 'avatar_color', length: 20, nullable: true })
  avatarColor: string;

  @Column({ name: 'preferred_currency', length: 10, default: 'KRW' })
  preferredCurrency: string;

  @Column({ name: 'theme_mode', length: 10, default: 'system' })
  themeMode: string;

  @Column({ name: 'notify_recurring_auto', default: true })
  notifyRecurringAuto: boolean;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;
}
