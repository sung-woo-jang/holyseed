import { Entity, Column, BeforeInsert } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity('customers')
export class Customer extends BaseEntity {
  @ApiProperty({
    description: '고유 UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', unique: true })
  uuid: string;

  @ApiProperty({
    description: '토스 사용자 고유 ID',
    example: 'toss_user_12345',
    nullable: true,
  })
  @Column({ name: 'toss_user_id', unique: true, nullable: true })
  tossUserId: string;

  @ApiProperty({
    description: '고객 이름',
    example: '홍길동',
  })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({
    description: '전화번호',
    example: '010-1234-5678',
  })
  @Column({ length: 20 })
  phone: string;

  @ApiProperty({
    description: '이메일',
    example: 'hong@example.com',
    nullable: true,
  })
  @Column({ length: 255, nullable: true })
  email: string;

  @ApiProperty({
    description: 'Refresh Token',
    nullable: true,
  })
  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken: string;

  @BeforeInsert()
  generateUuid() {
    if (!this.uuid) {
      this.uuid = uuidv4();
    }
  }
}
