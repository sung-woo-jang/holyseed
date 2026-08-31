import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Couple } from '@/projects/wedding/modules/couples/entities/couple.entity';

@Entity('guestbook', { schema: 'wedding' })
@Index(['coupleId', 'createdAt'])
export class WeddingGuestbook {
  @ApiProperty({ description: '방명록 ID (UUID)' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'couple_id' })
  coupleId: string;

  @ManyToOne(() => Couple, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'couple_id' })
  couple: Couple;

  @ApiProperty({ description: '작성자 이름' })
  @Column({ name: 'guest_name', length: 50 })
  guestName: string;

  @ApiProperty({ description: '방명록 메시지' })
  @Column({ type: 'text' })
  message: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
