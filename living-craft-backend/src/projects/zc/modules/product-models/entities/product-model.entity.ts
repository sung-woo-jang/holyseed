import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Brand } from '../../brands/entities/brand.entity';
import { ProductModelLink } from '../../product-model-links/entities/product-model-link.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity({ schema: 'zc', name: 'product_models' })
export class ProductModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true, comment: 'FK to brands (사용자가 지정)' })
  brandId: string;

  @Column({ type: 'varchar', length: 100, comment: '사용자가 정의하는 "진짜" 모델명' })
  modelName: string;

  @Column({ type: 'varchar', length: 255, comment: '표시용 제품명' })
  displayName: string;

  @Column({ type: 'text', nullable: true, comment: '사용자가 작성한 설명' })
  description: string;

  @Column({ type: 'jsonb', nullable: true, comment: '사용자가 정의한 스펙' })
  specifications: Record<string, string>;

  @Column({ type: 'text', nullable: true, comment: '대표 이미지' })
  thumbnailUrl: string;

  @Column({ type: 'boolean', default: true, comment: '추적 활성화 여부' })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true, comment: 'FK to zc.categories (통합 카테고리)' })
  unifiedCategoryId: string;

  @Column({ type: 'int', nullable: true, comment: '자재 원가 (연결된 listing 최저가 자동계산 또는 수동)' })
  materialCost: number;

  @Column({ type: 'int', nullable: true, default: 0, comment: '시공비 (고정)' })
  laborCost: number;

  @Column({ type: 'float', nullable: true, comment: '자재 마진율 (%)' })
  marginRate: number;

  @Column({ type: 'text', nullable: true, comment: '가격 메모' })
  priceNote: string;

  @Column({ type: 'timestamp', nullable: true, comment: '가격 마지막 수정일' })
  priceUpdatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Brand, { nullable: true })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'unifiedCategoryId' })
  unifiedCategory: Category;

  @OneToMany(() => ProductModelLink, (link) => link.model)
  links: ProductModelLink[];
}
