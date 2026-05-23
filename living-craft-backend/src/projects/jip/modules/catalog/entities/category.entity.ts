import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { ServiceItem } from './service-item.entity';

@Entity('categories', { schema: 'jip' })
export class Category extends BaseEntity {
  @Column({ length: 50, unique: true })
  code: string;

  @Column({ length: 50 })
  name: string;

  @Column({ type: 'text', nullable: true })
  intro: string;

  @Column({ length: 20, default: 'default' })
  color: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => ServiceItem, (item) => item.category)
  items: ServiceItem[];
}
