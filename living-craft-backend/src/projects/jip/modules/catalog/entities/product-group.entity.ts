import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { ServiceItem } from './service-item.entity';
import { Product } from './product.entity';

@Entity('product_groups', { schema: 'jip' })
export class ProductGroup extends BaseEntity {
  @Column({ name: 'service_item_id' })
  serviceItemId: number;

  @Column({ length: 50 })
  code: string;

  @Column({ length: 100 })
  label: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @ManyToOne(() => ServiceItem, (item) => item.productGroups)
  @JoinColumn({ name: 'service_item_id' })
  serviceItem: ServiceItem;

  @OneToMany(() => Product, (p) => p.productGroup)
  products: Product[];
}
