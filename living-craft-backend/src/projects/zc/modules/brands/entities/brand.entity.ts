import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ProductListing } from '../../product-listings/entities/product-listing.entity';

@Entity({ schema: 'zc', name: 'brands' })
export class Brand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true, comment: '브랜드명 (예: 코헬러, 한스그로에)' })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '영문 브랜드명' })
  nameEn: string;

  @Column({ type: 'text', nullable: true, comment: '로고 이미지 URL' })
  logoUrl: string;

  @Column({ type: 'text', nullable: true, comment: '브랜드 설명' })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ProductListing, (listing) => listing.brand)
  productListings: ProductListing[];
}
