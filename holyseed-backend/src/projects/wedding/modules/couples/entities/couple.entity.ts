import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('couples', { schema: 'wedding' })
export class Couple {
  @ApiProperty({ description: '커플 ID (UUID)' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'URL slug (고유)', example: 'sungwoo-minji' })
  @Index({ unique: true })
  @Column({ unique: true, length: 100 })
  slug: string;

  @ApiProperty({ description: '신랑 이름' })
  @Column({ name: 'groom_name', length: 50 })
  groomName: string;

  @ApiProperty({ description: '신부 이름' })
  @Column({ name: 'bride_name', length: 50 })
  brideName: string;

  @ApiPropertyOptional({ description: '결혼식 일시' })
  @Column({ name: 'wedding_date', type: 'timestamp', nullable: true })
  weddingDate?: Date;

  @ApiPropertyOptional({ description: '예식장 정보 (name, address, lat, lng, hall, floor)' })
  @Column({ name: 'wedding_venue', type: 'jsonb', nullable: true })
  weddingVenue?: Record<string, any>;

  @ApiPropertyOptional({ description: '계좌 정보 배열 (bank, account, holder, relation)' })
  @Column({ name: 'account_info', type: 'jsonb', default: [] })
  accountInfo: Record<string, any>[];

  @ApiPropertyOptional({ description: '테마 설정' })
  @Column({ name: 'theme_settings', type: 'jsonb', default: {} })
  themeSettings: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations (optional loading)
  @OneToMany('WeddingUser', (user: any) => user.couple)
  users: any[];

  @OneToMany('WeddingMedia', (media: any) => media.couple)
  media: any[];

  @OneToMany('WeddingAttendance', (a: any) => a.couple)
  attendances: any[];

  @OneToMany('WeddingContentRow', (cr: any) => cr.couple)
  contentRows: any[];
}
