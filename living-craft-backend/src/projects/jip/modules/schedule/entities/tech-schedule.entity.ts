import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

export type SlotStatus = 'open' | 'busy' | 'off';

@Entity('tech_schedule', { schema: 'jip' })
export class TechSchedule extends BaseEntity {
  @Column({ type: 'date', unique: true })
  date: string;

  @Column({ type: 'varchar', length: 10, default: 'open' })
  am: SlotStatus;

  @Column({ type: 'varchar', length: 10, default: 'open' })
  noon: SlotStatus;

  @Column({ type: 'varchar', length: 10, default: 'open' })
  pm: SlotStatus;

  @Column({ type: 'varchar', length: 10, default: 'open' })
  eve: SlotStatus;

  @Column({ type: 'text', nullable: true })
  note: string;
}
