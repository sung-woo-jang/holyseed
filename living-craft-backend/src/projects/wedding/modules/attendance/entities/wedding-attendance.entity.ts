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

export enum AttendanceStatus {
  ATTENDING = 'ATTENDING',
  NOT_ATTENDING = 'NOT_ATTENDING',
  MAYBE = 'MAYBE',
}

@Entity('attendances', { schema: 'wedding' })
@Index(['coupleId', 'createdAt'])
export class WeddingAttendance {
  @ApiProperty({ description: '참석 응답 ID (UUID)' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'couple_id' })
  coupleId: string;

  @ManyToOne(() => Couple, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'couple_id' })
  couple: Couple;

  @ApiProperty({ description: '하객 이름' })
  @Column({ name: 'guest_name', length: 100 })
  guestName: string;

  @ApiProperty({ description: '참석 인원', minimum: 1, maximum: 10 })
  @Column({ name: 'guest_count', default: 1 })
  guestCount: number;

  @ApiProperty({ enum: AttendanceStatus, description: '참석 여부' })
  @Column({
    name: 'attendance_status',
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.ATTENDING,
  })
  attendanceStatus: AttendanceStatus;

  @ApiPropertyOptional({ description: '축하 메시지' })
  @Column({ type: 'text', nullable: true })
  message?: string;

  @ApiPropertyOptional({ description: '연락처' })
  @Column({ name: 'phone_number', nullable: true, length: 20 })
  phoneNumber?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
