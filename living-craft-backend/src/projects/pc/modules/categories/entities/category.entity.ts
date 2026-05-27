import { Entity, Column, Index, Unique } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('pc_categories', { schema: 'jip' })
@Unique(['parentId', 'name'])
export class PcCategory extends BaseEntity {
  @ApiPropertyOptional({ description: '부모 카테고리 ID (null이면 최상위)', example: null })
  @Column({ name: 'parent_id', type: 'int', nullable: true })
  @Index()
  parentId: number;

  @ApiProperty({ description: '카테고리명', example: '주방후드' })
  @Column({ length: 80 })
  name: string;

  @ApiProperty({ description: '정렬 순서', example: 0 })
  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}
