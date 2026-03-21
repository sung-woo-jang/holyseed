import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { Service } from '@modules/services/entities';

@Entity('portfolios')
export class Portfolio extends BaseEntity {
  @ApiProperty({
    description: '카테고리',
    example: '인테리어필름',
  })
  @Column({ length: 50 })
  category: string;

  @ApiProperty({
    description: '프로젝트명',
    example: '강남 오피스텔 인테리어 필름 시공',
  })
  @Column({ name: 'project_name', length: 200 })
  projectName: string;

  @ApiPropertyOptional({
    description: '고객사',
    example: '강남 오피스텔',
  })
  @Column({ length: 100, nullable: true })
  client: string;

  @ApiProperty({
    description: '작업 기간',
    example: '2일',
  })
  @Column({ length: 50 })
  duration: string;

  @ApiProperty({
    description: '간단 설명',
    example: '고급 인테리어 필름으로 새 집처럼 변신',
  })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({
    description: '상세 설명',
    example: '기존 싱크대와 가구를 대리석 패턴 필름으로 시공하여...',
  })
  @Column({ name: 'detailed_description', type: 'text' })
  detailedDescription: string;

  @ApiProperty({
    description: '이미지 URL 목록',
    example: ['https://example.com/image1.jpg'],
  })
  @Column({ type: 'simple-array' })
  images: string[];

  @ApiPropertyOptional({
    description: '태그 목록',
    example: ['대리석', '싱크대', '리모델링'],
  })
  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @ApiProperty({
    description: '관련 서비스',
    type: () => Service,
  })
  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @ApiProperty({
    description: '서비스 ID',
    example: 1,
  })
  @Column({ name: 'service_id' })
  serviceId: number;

  @ApiProperty({
    description: '활성화 여부',
    example: true,
  })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({
    description: '정렬 순서',
    example: 1,
  })
  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}
