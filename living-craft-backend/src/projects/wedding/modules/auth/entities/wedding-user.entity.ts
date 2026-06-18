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
import { ApiProperty } from '@nestjs/swagger';
import { Couple } from '@/projects/wedding/modules/couples/entities/couple.entity';

export enum WeddingUserRole {
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

@Entity('users', { schema: 'wedding' })
export class WeddingUser {
  @ApiProperty({ description: '사용자 ID (UUID)' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '이메일 (로그인 ID)', example: 'admin@example.com' })
  @Index({ unique: true })
  @Column({ unique: true, length: 200 })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @ApiProperty({ enum: WeddingUserRole, description: '역할' })
  @Column({ type: 'enum', enum: WeddingUserRole, default: WeddingUserRole.ADMIN })
  role: WeddingUserRole;

  @Column({ name: 'couple_id' })
  coupleId: string;

  @ManyToOne(() => Couple, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'couple_id' })
  couple: Couple;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
