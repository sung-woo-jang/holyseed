import { Entity, Column, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('pc_product_features', { schema: 'jip' })
export class ProductFeature extends BaseEntity {
  @ApiProperty({ description: '제품 ID', example: 1 })
  @Column({ name: 'product_id', type: 'int' })
  @Index()
  productId: number;

  @ApiProperty({ description: '특징 텍스트', example: '실버 코팅 마감' })
  @Column({ length: 200 })
  label: string;

  @ApiProperty({ description: '정렬 순서', default: 0 })
  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}
