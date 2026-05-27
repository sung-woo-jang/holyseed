import { Entity, Column, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('pc_product_colors', { schema: 'jip' })
export class ProductColor extends BaseEntity {
  @ApiProperty({ description: '제품 ID', example: 1 })
  @Column({ name: 'product_id', type: 'int' })
  @Index()
  productId: number;

  @ApiProperty({ description: '색상/옵션명', example: '실버' })
  @Column({ length: 100 })
  label: string;

  @ApiProperty({ description: '정렬 순서', default: 0 })
  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}
