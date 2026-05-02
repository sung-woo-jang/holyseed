import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Site } from '../../sites/entities/site.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity({ schema: 'zc', name: 'site_categories' })
@Index(['siteId', 'siteCategoryCode'], { unique: true })
export class SiteCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', comment: 'FK to sites' })
  siteId: string;

  @Column({ type: 'varchar', length: 50, comment: '사이트 내부 카테고리 코드 (예: Dasis 002)' })
  siteCategoryCode: string;

  @Column({ type: 'varchar', length: 100, comment: '카테고리명' })
  name: string;

  @Column({ type: 'uuid', nullable: true, comment: '상위 카테고리 (같은 사이트 내에서만)' })
  parentId: string;

  @Column({ type: 'int', default: 1, comment: '1: 대분류, 2: 중분류, 3: 소분류' })
  level: number;

  @Column({ type: 'text', nullable: true, comment: '카테고리 URL' })
  url: string;

  @Column({ type: 'uuid', nullable: true, comment: 'FK to zc.categories (통합 카테고리 매핑)' })
  unifiedCategoryId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Site)
  @JoinColumn({ name: 'siteId' })
  site: Site;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'unifiedCategoryId' })
  unifiedCategory: Category;
}
