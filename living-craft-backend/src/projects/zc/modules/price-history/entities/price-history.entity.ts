import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ProductListing } from '../../product-listings/entities/product-listing.entity';

@Entity({ schema: 'zc', name: 'price_history' })
@Index(['listingId', 'recordedAt'])
export class PriceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', comment: 'FK to product_listings' })
  listingId: string;

  @Column({ type: 'int', comment: '해당 시점의 가격' })
  price: number;

  @Column({ type: 'int', nullable: true, comment: '해당 시점의 할인가' })
  discountPrice: number;

  @Column({ type: 'timestamp', comment: '가격 기록 시각' })
  recordedAt: Date;

  @Column({ type: 'boolean', default: true, comment: '해당 시점 판매 가능 여부' })
  isAvailable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => ProductListing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listingId' })
  listing: ProductListing;
}
