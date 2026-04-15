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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Brand, { nullable: true })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;

  @OneToMany(() => ProductModelLink, (link) => link.model)
  links: ProductModelLink[];
}
