import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ schema: 'zc', name: 'sites' })
export class Site {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true, comment: '사이트 코드 (예: dasis, naver, coupang)' })
  code: string;

  @Column({ type: 'varchar', length: 100, comment: '사이트명 (예: 다시스, 네이버쇼핑)' })
  name: string;

  @Column({ type: 'text', comment: '사이트 기본 URL' })
  baseUrl: string;

  @Column({ type: 'boolean', default: true, comment: '크롤링 활성화 여부' })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true, comment: '사이트별 크롤러 설정' })
  crawlerConfig: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
