import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Site } from '../../sites/entities/site.entity';
import { SiteCategory } from '../../site-categories/entities/site-category.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { ProductImage } from '../../product-images/entities/product-image.entity';
import { PriceHistory } from '../../price-history/entities/price-history.entity';
import { ProductModelLink } from '../../product-model-links/entities/product-model-link.entity';

@Entity({ schema: 'zc', name: 'product_listings' })
@Index(['siteId', 'siteProductId'], { unique: true })
export class ProductListing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', comment: 'FK to sites' })
  siteId: string;

  @Column({ type: 'uuid', nullable: true, comment: 'FK to site_categories' })
  siteCategoryId: string;

  @Column({ type: 'uuid', nullable: true, comment: 'FK to brands' })
  brandId: string;

  @Column({ type: 'varchar', length: 100, comment: '사이트 내부 상품 ID (예: Dasis goodsNo)' })
  siteProductId: string;

  @Column({ type: 'varchar', length: 255, comment: '사이트에 표시되는 제품명' })
  productName: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '크롤링 시 추출한 모델명 (있는 경우만)' })
  extractedModelName: string;

  @Column({ type: 'int', comment: '현재 가격' })
  currentPrice: number;

  @Column({ type: 'int', nullable: true, comment: '현재 할인가' })
  currentDiscountPrice: number;

  @Column({ type: 'text', nullable: true, comment: '제품 설명' })
  description: string;

  @Column({ type: 'jsonb', nullable: true, comment: '제품 스펙 정보' })
  specifications: Record<string, string>;

  @Column({ type: 'text', nullable: true, comment: '제품 상세 페이지 URL' })
  productUrl: string;

  @Column({ type: 'boolean', default: true, comment: '판매 가능 여부' })
  isAvailable: boolean;

  @Column({ type: 'int', nullable: true, comment: '재고 수량' })
  stock: number;

  @Column({ type: 'int', nullable: true, comment: '배송비' })
  deliveryFee: number;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '제조사' })
  manufacturer: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '원산지' })
  origin: string;

  @Column({ type: 'timestamp', nullable: true, comment: '마지막 크롤링 시각' })
  lastCrawledAt: Date;

  @Column({ type: 'boolean', default: false, comment: '수동 입력 여부 (true면 크롤러가 덮어쓰지 않음)' })
  isManual: boolean;

  @Column({ type: 'text', nullable: true, comment: '수동 입력 가격 출처 메모' })
  manualPriceNote: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Site)
  @JoinColumn({ name: 'siteId' })
  site: Site;

  @ManyToOne(() => SiteCategory, { nullable: true })
  @JoinColumn({ name: 'siteCategoryId' })
  siteCategory: SiteCategory;

  @ManyToOne(() => Brand, { nullable: true })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;

  @OneToMany(() => ProductImage, (image) => image.listing)
  productImages: ProductImage[];

  @OneToMany(() => PriceHistory, (history) => history.listing)
  priceHistories: PriceHistory[];

  @OneToOne(() => ProductModelLink, (link) => link.listing)
  modelLink: ProductModelLink;
}
