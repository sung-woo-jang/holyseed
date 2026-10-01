import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { FridgeHousehold } from './household.entity';
import { FridgePerson } from './person.entity';

export type FridgeRepeat = 'none' | 'weekly';

@Entity('events', { schema: 'fridge' })
export class FridgeEvent extends BaseEntity {
  @Index()
  @Column({ name: 'household_id', type: 'int' })
  householdId: number;

  @ManyToOne(() => FridgeHousehold, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'household_id' })
  household?: FridgeHousehold;

  @Column({ type: 'date' })
  date: string;

  /** HH:mm, 종일이면 빈 문자열 */
  @Column({ type: 'varchar', length: 5, default: '' })
  time: string;

  @Column({ length: 100 })
  title: string;

  /** null이면 "모두" */
  @Column({ name: 'person_id', type: 'int', nullable: true })
  personId: number | null;

  @ManyToOne(() => FridgePerson, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'person_id' })
  person?: FridgePerson;

  @Column({ type: 'varchar', length: 10, default: 'none' })
  repeat: FridgeRepeat;
}
