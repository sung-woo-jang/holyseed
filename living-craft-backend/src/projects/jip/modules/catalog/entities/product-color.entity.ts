import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Product } from './product.entity';

@Entity('product_colors', { schema: 'jip' })
export class ProductColor extends BaseEntity {
  @Column({ name: 'product_id' })
  productId: number;

  @Column({ length: 100 })
  label: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @ManyToOne(() => Product, (p) => p.colors)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
