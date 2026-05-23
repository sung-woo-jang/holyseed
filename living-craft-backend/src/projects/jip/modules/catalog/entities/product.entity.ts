import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { ProductGroup } from './product-group.entity';
import { ProductFeature } from './product-feature.entity';
import { ProductColor } from './product-color.entity';

@Entity('products', { schema: 'jip' })
export class Product extends BaseEntity {
  @Column({ name: 'product_group_id' })
  productGroupId: number;

  @Column({ length: 30, unique: true })
  code: string;

  @Column({ length: 50 })
  brand: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, nullable: true })
  spec: string;

  @Column({ type: 'int' })
  price: number;

  @Column({ name: 'illust_kind', length: 50, default: 'default' })
  illustKind: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => ProductGroup, (pg) => pg.products)
  @JoinColumn({ name: 'product_group_id' })
  productGroup: ProductGroup;

  @OneToMany(() => ProductFeature, (f) => f.product)
  features: ProductFeature[];

  @OneToMany(() => ProductColor, (c) => c.product)
  colors: ProductColor[];
}
