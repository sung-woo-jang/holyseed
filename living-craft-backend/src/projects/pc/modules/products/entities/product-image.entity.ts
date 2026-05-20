import { Entity, Column, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('product_images', { schema: 'pc' })
export class ProductImage extends BaseEntity {
  @ApiProperty({ description: '제품 ID', example: 1 })
  @Column({ name: 'product_id', type: 'int' })
  @Index()
  productId: number;

  @ApiProperty({ description: '이미지 URL', example: 'https://...' })
  @Column({ length: 500 })
  url: string;

  @ApiPropertyOptional({ description: 'NCP S3 키 (삭제용)', example: 'pc/products/abc.webp' })
  @Column({ name: 's3_key', length: 500, nullable: true })
  s3Key: string;

  @ApiProperty({ description: '대표 이미지 여부', default: false })
  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @ApiProperty({ description: '정렬 순서', default: 0 })
  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @ApiPropertyOptional({ description: '이미지 너비', example: 800 })
  @Column({ type: 'int', nullable: true })
  width: number;

  @ApiPropertyOptional({ description: '이미지 높이', example: 600 })
  @Column({ type: 'int', nullable: true })
  height: number;
}
