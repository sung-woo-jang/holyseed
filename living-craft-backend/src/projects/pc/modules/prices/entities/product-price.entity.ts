import { Entity, Column, Index, Unique } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('product_prices', { schema: 'pc' })
@Unique(['productId', 'vendorId'])
export class ProductPrice extends BaseEntity {
  @ApiProperty({ description: '제품 ID', example: 1 })
  @Column({ name: 'product_id', type: 'int' })
  @Index()
  productId: number;

  @ApiProperty({ description: '업체 ID', example: 1 })
  @Column({ name: 'vendor_id', type: 'int' })
  @Index()
  vendorId: number;

  @ApiProperty({ description: '가격', example: 46000 })
  @Column({ type: 'decimal', precision: 14, scale: 2 })
  price: number;

  @ApiProperty({ description: '통화', default: 'KRW' })
  @Column({ length: 8, default: 'KRW' })
  currency: string;

  @ApiPropertyOptional({ description: '비고', example: '택배비포함' })
  @Column({ length: 255, nullable: true })
  note: string;

  @ApiPropertyOptional({ description: '견적일', example: '2025-05-01' })
  @Column({ name: 'quoted_at', type: 'date', nullable: true })
  quotedAt: Date;
}
