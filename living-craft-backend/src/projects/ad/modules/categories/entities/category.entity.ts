import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

export enum CategoryType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
}

@Entity('categories', { schema: 'ad' })
export class Category extends BaseEntity {
  @Column({ name: 'household_id', nullable: true })
  householdId: number;

  @Column({ type: 'enum', enum: CategoryType })
  type: CategoryType;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 50, nullable: true })
  icon: string;

  @Column({ length: 20, nullable: true })
  color: string;

  @Column({ name: 'is_builtin', default: false })
  isBuiltin: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}
