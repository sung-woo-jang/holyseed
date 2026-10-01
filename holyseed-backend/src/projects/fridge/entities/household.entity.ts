import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

export type FridgeNightMode = 'auto' | 'off';

@Entity('households', { schema: 'fridge' })
export class FridgeHousehold extends BaseEntity {
  @Column({ length: 50 })
  name: string;

  @Column({ name: 'night_mode', type: 'varchar', length: 10, default: 'auto' })
  nightMode: FridgeNightMode;

  @Column({ name: 'default_days', type: 'int', default: 7 })
  defaultDays: number;
}
