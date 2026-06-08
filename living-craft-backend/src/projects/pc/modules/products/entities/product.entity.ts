import { Entity, Column, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('pc_products', { schema: 'jip' })
export class Product extends BaseEntity {
  @ApiPropertyOptional({ description: '고객 URL 코드 (고유)', example: 'k1-1' })
  @Column({ length: 30, nullable: true, unique: true })
  code: string;

  @ApiPropertyOptional({ description: 'ServiceItem ID (고객 노출용)' })
  @Column({ name: 'service_item_id', type: 'int', nullable: true })
  @Index()
  serviceItemId: number;

  @ApiProperty({ description: '일러스트 종류', default: 'default' })
  @Column({ name: 'illust_kind', length: 50, default: 'default' })
  illustKind: string;

  @ApiProperty({ description: '노출 순서 (ServiceItem 안에서)', default: 0 })
  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @ApiPropertyOptional({ description: '대표가 캐시 (활성 업체 최저가)', example: 46000 })
  @Column({ name: 'representative_price', type: 'int', nullable: true })
  representativePrice: number;
  @ApiProperty({ description: '모델코드 (고유)', example: 'G60AL' })
  @Column({ name: 'model_code', length: 120, unique: true })
  modelCode: string;

  @ApiProperty({ description: '표시명', example: 'G60 실버 슬라이드후드' })
  @Column({ name: 'display_name', length: 200 })
  displayName: string;

  @ApiProperty({ description: '카테고리 ID', example: 2 })
  @Column({ name: 'category_id', type: 'int' })
  @Index()
  categoryId: number;

  @ApiPropertyOptional({ description: '브랜드', example: '린나이' })
  @Column({ length: 80, nullable: true })
  brand: string;

  @ApiPropertyOptional({ description: '사양/스펙', example: '기본형 실버 가로600' })
  @Column({ type: 'text', nullable: true })
  spec: string;

  @ApiProperty({ description: '단위', default: 'EA' })
  @Column({ length: 20, default: 'EA' })
  unit: string;

  @ApiPropertyOptional({ description: '설명 (내부 메모용)' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiPropertyOptional({ description: '고객 노출 소개문' })
  @Column({ type: 'text', nullable: true })
  intro: string;

  @ApiPropertyOptional({ description: '고객 상세 태그라인', example: '매일 쓰는 주방, 작은 것부터 바꿔봐요.' })
  @Column({ length: 200, nullable: true })
  tagline: string;

  @ApiPropertyOptional({ description: '고객 후기 목록 (JSON)' })
  @Column({ type: 'jsonb', nullable: true })
  reviews: Array<{ name: string; area: string; stars: number; text: string }>;

  @ApiPropertyOptional({ description: 'FAQ 목록 (JSON)' })
  @Column({ type: 'jsonb', nullable: true })
  faqs: Array<{ q: string; a: string }>;

  @ApiPropertyOptional({ description: '신뢰 배지 목록 (JSON)' })
  @Column({ name: 'trust_badges', type: 'jsonb', nullable: true })
  trustBadges: Array<{ icon: string; title: string; desc: string }>;

  @ApiPropertyOptional({ description: '시공 단계 목록 (JSON)' })
  @Column({ name: 'install_steps', type: 'jsonb', nullable: true })
  installSteps: Array<{ title: string; desc: string }>;

  @ApiPropertyOptional({ description: '비고' })
  @Column({ type: 'text', nullable: true })
  note: string;

  @ApiPropertyOptional({ description: '대표 이미지 URL (캐시)', example: 'https://...' })
  @Column({ name: 'primary_image_url', length: 500, nullable: true })
  primaryImageUrl: string;

  @ApiProperty({ description: '활성 여부', default: true })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
