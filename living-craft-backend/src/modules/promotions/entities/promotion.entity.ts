import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { Icon } from '@modules/icons/entities/icon.entity';

export enum PromotionLinkType {
  EXTERNAL = 'external',
  INTERNAL = 'internal',
}

@Entity('promotions')
export class Promotion extends BaseEntity {
  @ApiProperty({
    description: '프로모션 제목',
    example: '친구 초대하고 함께 쿠폰 받기',
  })
  @Column({ length: 100 })
  title: string;

  @ApiPropertyOptional({
    description: '프로모션 부제목',
    example: '이용하는 친구 초대하고 할인 쿠폰 받기!',
  })
  @Column({ length: 200, nullable: true })
  subtitle: string;

  @ApiProperty({
    description: '아이콘 ID',
    example: 1,
  })
  @Column({ name: 'icon_id' })
  iconId: number;

  @ManyToOne(() => Icon, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'icon_id' })
  icon: Icon;

  @ApiProperty({
    description: '아이콘 배경색',
    example: '#E3F2FD',
  })
  @Column({ name: 'icon_bg_color', length: 10 })
  iconBgColor: string;

  @ApiProperty({
    description: '아이콘 색상',
    example: '#1976D2',
  })
  @Column({ name: 'icon_color', length: 10 })
  iconColor: string;

  @ApiPropertyOptional({
    description: '링크 URL',
    example: 'https://example.com/promotion',
  })
  @Column({ name: 'link_url', nullable: true })
  linkUrl: string;

  @ApiProperty({
    description: '링크 타입 (external: 외부 브라우저, internal: 앱 내 이동)',
    enum: PromotionLinkType,
    example: PromotionLinkType.EXTERNAL,
  })
  @Column({
    name: 'link_type',
    type: 'enum',
    enum: PromotionLinkType,
    default: PromotionLinkType.EXTERNAL,
  })
  linkType: PromotionLinkType;

  @ApiPropertyOptional({
    description: '게시 시작일',
    example: '2024-01-01',
  })
  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date;

  @ApiPropertyOptional({
    description: '게시 종료일',
    example: '2024-12-31',
  })
  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date;

  @ApiProperty({
    description: '클릭 수',
    example: 0,
  })
  @Column({ name: 'click_count', default: 0 })
  clickCount: number;

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
