import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { AdUser } from '../../users/entities/ad-user.entity';

@Entity('mcp_tokens', { schema: 'ad' })
export class McpToken extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => AdUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: AdUser;

  @Column({ unique: true })
  token: string;

  @Column({ length: 100, nullable: true })
  label: string | null;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt: Date | null;
}
