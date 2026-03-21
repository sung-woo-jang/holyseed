import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerProfileDto {
  @ApiProperty({
    description: '고객 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '고객 이름',
    example: '홍길동',
  })
  name: string;

  @ApiProperty({
    description: '전화번호',
    example: '010-1234-5678',
  })
  phone: string;

  @ApiPropertyOptional({
    description: '이메일',
    example: 'hong@example.com',
  })
  email?: string;

  @ApiProperty({
    description: '가입일시',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: string;
}
