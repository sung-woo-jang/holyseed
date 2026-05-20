import { Entity, Column } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('vendors', { schema: 'pc' })
export class Vendor extends BaseEntity {
  @ApiProperty({ description: '업체명', example: 'A마트' })
  @Column({ length: 120, unique: true })
  name: string;

  @ApiPropertyOptional({ description: '담당자', example: '홍길동' })
  @Column({ length: 120, nullable: true })
  contact: string;

  @ApiPropertyOptional({ description: '전화번호', example: '02-1234-5678' })
  @Column({ length: 40, nullable: true })
  phone: string;

  @ApiPropertyOptional({ description: '이메일', example: 'vendor@example.com' })
  @Column({ length: 120, nullable: true })
  email: string;

  @ApiPropertyOptional({ description: '홈페이지', example: 'https://vendor.com' })
  @Column({ length: 255, nullable: true })
  homepage: string;

  @ApiPropertyOptional({ description: '메모' })
  @Column({ type: 'text', nullable: true })
  memo: string;

  @ApiProperty({ description: '활성 여부', default: true })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({ description: '정렬 순서', default: 0 })
  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}
