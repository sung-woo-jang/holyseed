import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Category } from './category.entity';

@Entity('service_items', { schema: 'jip' })
export class ServiceItem extends BaseEntity {
  @Column({ name: 'category_id' })
  categoryId: number;

  @Column({ length: 20, unique: true })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  price: number;

  @Column({ length: 100, nullable: true })
  unit: string;

  @Column({ length: 50, nullable: true })
  duration: string;

  @Column({ name: 'illust_kind', length: 50, default: 'default' })
  illustKind: string;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => Category, (cat) => cat.items)
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
