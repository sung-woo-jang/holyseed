import { Entity, Column } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('users', { schema: 'pc' })
export class PcUser extends BaseEntity {
  @ApiProperty({ description: '사용자명', example: 'admin' })
  @Column({ length: 50, unique: true })
  username: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @ApiPropertyOptional({ description: '표시 이름', example: '관리자' })
  @Column({ name: 'display_name', length: 50, nullable: true })
  displayName: string;

  @ApiPropertyOptional({ description: '마지막 로그인 시각' })
  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;
}
