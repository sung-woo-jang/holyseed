import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { FridgeUser } from './user.entity';

@Entity('mcp_tokens', { schema: 'fridge' })
export class FridgeMcpToken extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => FridgeUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: FridgeUser;

  @Column({ unique: true })
  token: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  label: string | null;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt: Date | null;
}
