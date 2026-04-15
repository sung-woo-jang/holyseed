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
import { ProductModel } from '../../product-models/entities/product-model.entity';

@Entity({ schema: 'zc', name: 'product_model_links' })
@Index(['listingId'], { unique: true })
export class ProductModelLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', comment: 'FK to product_listings' })
  listingId: string;

  @Column({ type: 'uuid', comment: 'FK to product_models' })
  modelId: string;

  @Column({ type: 'timestamp', comment: '매칭한 시각' })
  linkedAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '매칭한 사용자 (선택사항)' })
  linkedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => ProductListing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listingId' })
  listing: ProductListing;

  @ManyToOne(() => ProductModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'modelId' })
  model: ProductModel;
}
