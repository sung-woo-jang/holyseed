import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Product } from './product.entity';

@Entity('product_features', { schema: 'jip' })
export class ProductFeature extends BaseEntity {
  @Column({ name: 'product_id' })
  productId: number;

  @Column({ length: 200 })
  label: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @ManyToOne(() => Product, (p) => p.features)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
