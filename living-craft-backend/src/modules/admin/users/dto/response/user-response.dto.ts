import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { UserRole, UserStatus } from '@common/enums';

@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty({ description: 'ID', example: 1 })
  id: number;

  @Expose()
  @ApiProperty({
    description: 'UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  uuid: string;

  @Expose()
  @ApiProperty({ description: '이름', example: '홍' })
  firstName: string;

  @Expose()
  @ApiProperty({ description: '성', example: '길동' })
  lastName: string;

  @Expose()
  @ApiProperty({ description: '사용자명', example: 'hong.gildong' })
  username: string;

  @Expose()
  @ApiProperty({ description: '이메일', example: 'hong@example.com' })
  email: string;

  @Expose()
  @ApiProperty({
    description: '전화번호',
    example: '010-1234-5678',
    required: false,
  })
  phoneNumber: string;

  @Expose()
  @ApiProperty({ description: '상태', enum: UserStatus })
  status: UserStatus;

  @Expose()
  @ApiProperty({ description: '역할', enum: UserRole })
  role: UserRole;

  @Expose()
  @ApiProperty({ description: '마지막 로그인', required: false })
  lastLoginAt: Date;

  @Expose()
  @ApiProperty({ description: '생성일', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: '수정일', example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  // 비밀번호는 응답에서 제외
}
