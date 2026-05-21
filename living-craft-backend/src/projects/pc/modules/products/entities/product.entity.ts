import { Entity, Column, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('products', { schema: 'pc' })
export class Product extends BaseEntity {
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
