import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { UserRole, UserStatus } from '@common/enums';

@Entity('admin_users')
export class User extends BaseEntity {
  @ApiProperty({
    description: '사용자 UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', unique: true, generated: 'uuid' })
  uuid: string;

  @ApiProperty({
    description: '이름',
    example: '홍',
  })
  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @ApiProperty({
    description: '성',
    example: '길동',
  })
  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @ApiProperty({
    description: '사용자명',
    example: 'hong.gildong',
  })
  @Column({ unique: true, length: 100 })
  username: string;

  @ApiProperty({
    description: '이메일',
    example: 'hong@example.com',
  })
  @Column({ unique: true, length: 255 })
  email: string;

  @ApiProperty({
    description: '비밀번호 (해시)',
  })
  @Column({ select: false })
  password: string;

  @ApiProperty({
    description: '전화번호',
    example: '010-1234-5678',
    required: false,
  })
  @Column({ name: 'phone_number', length: 20, nullable: true })
  phoneNumber: string;

  @ApiProperty({
    description: '사용자 상태',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.INVITED,
  })
  status: UserStatus;

  @ApiProperty({
    description: '사용자 역할',
    enum: UserRole,
    example: UserRole.ADMIN,
  })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CASHIER,
  })
  role: UserRole;

  @ApiProperty({
    description: '마지막 로그인 시간',
    required: false,
  })
  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;
}
