import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ProductListing } from '../../product-listings/entities/product-listing.entity';

@Entity({ schema: 'zc', name: 'product_images' })
export class ProductImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', comment: 'FK to product_listings' })
  listingId: string;

  @Column({ type: 'text', comment: '원본 이미지 URL' })
  originalUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '로컬 저장 경로' })
  localPath: string;

  @Column({ type: 'varchar', length: 20, default: 'detail', comment: 'thumbnail, detail, spec 등' })
  type: string;

  @Column({ type: 'int', default: 0, comment: '정렬 순서' })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => ProductListing, (listing) => listing.productImages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listingId' })
  listing: ProductListing;
}
