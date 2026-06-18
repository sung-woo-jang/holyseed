import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Couple } from '@/projects/wedding/modules/couples/entities/couple.entity';

export enum ContentRowType {
  TOP_RANKED = 'TOP_RANKED',
  IMAGE_GALLERY = 'IMAGE_GALLERY',
  VIDEO_GALLERY = 'VIDEO_GALLERY',
}

@Entity('content_rows', { schema: 'wedding' })
@Index(['coupleId', 'order'])
@Index(['coupleId', 'isVisible', 'order'])
export class WeddingContentRow {
  @ApiProperty({ description: '콘텐츠 행 ID (UUID)' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'couple_id' })
  coupleId: string;

  @ManyToOne(() => Couple, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'couple_id' })
  couple: Couple;

  @ApiProperty({ description: '제목' })
  @Column({ length: 200 })
  title: string;

  @ApiProperty({ enum: ContentRowType })
  @Column({ name: 'row_type', type: 'enum', enum: ContentRowType })
  rowType: ContentRowType;

  @ApiProperty({ description: '정렬 순서' })
  @Column({ default: 0 })
  order: number;

  @ApiProperty({ description: '공개 여부' })
  @Column({ name: 'is_visible', default: true })
  isVisible: boolean;

  @ApiPropertyOptional({ description: '아이템 배열 (src, alt, order, mediaId, type 등)' })
  @Column({ type: 'jsonb', default: [] })
  items: Record<string, any>[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
