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

export enum ProcessingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum ModerationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('media', { schema: 'wedding' })
@Index(['coupleId', 'moderationStatus', 'createdAt'])
@Index(['processingStatus'])
export class WeddingMedia {
  @ApiProperty({ description: '미디어 ID (UUID)' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'couple_id' })
  coupleId: string;

  @ManyToOne(() => Couple, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'couple_id' })
  couple: Couple;

  @ApiPropertyOptional({ description: '원본 파일 로컬 경로' })
  @Column({ name: 'local_original_path', nullable: true })
  localOriginalPath?: string;

  @ApiPropertyOptional({ description: '리사이즈 파일 로컬 경로' })
  @Column({ name: 'local_resized_path', nullable: true })
  localResizedPath?: string;

  @ApiPropertyOptional({ description: '썸네일 파일 로컬 경로' })
  @Column({ name: 'local_thumbnail_path', nullable: true })
  localThumbnailPath?: string;

  @ApiProperty({ enum: ProcessingStatus })
  @Column({
    name: 'processing_status',
    type: 'enum',
    enum: ProcessingStatus,
    default: ProcessingStatus.COMPLETED,
  })
  processingStatus: ProcessingStatus;

  @ApiProperty({ enum: ModerationStatus })
  @Column({
    name: 'moderation_status',
    type: 'enum',
    enum: ModerationStatus,
    default: ModerationStatus.PENDING,
  })
  moderationStatus: ModerationStatus;

  @ApiPropertyOptional({ description: '업로더 이름' })
  @Column({ name: 'uploader_name', nullable: true })
  uploaderName?: string;

  @ApiPropertyOptional({ description: '업로더 메시지' })
  @Column({ type: 'text', nullable: true })
  message?: string;

  @ApiProperty({ description: 'MIME 타입', example: 'image/jpeg' })
  @Column({ name: 'file_type', length: 100 })
  fileType: string;

  @ApiProperty({ description: '파일 크기 (bytes)' })
  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @ApiPropertyOptional({ description: '이미지 너비 (px)' })
  @Column({ nullable: true })
  width?: number;

  @ApiPropertyOptional({ description: '이미지 높이 (px)' })
  @Column({ nullable: true })
  height?: number;

  @ApiPropertyOptional({ description: '비디오 재생 시간 (초)' })
  @Column({ type: 'float', nullable: true })
  duration?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
