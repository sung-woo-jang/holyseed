import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('households', { schema: 'ad' })
export class Household extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, nullable: true })
  icon: string;

  @Column({ name: 'owner_user_id' })
  ownerUserId: number;

  @Column({ name: 'base_currency', length: 10, default: 'KRW' })
  baseCurrency: string;
}
