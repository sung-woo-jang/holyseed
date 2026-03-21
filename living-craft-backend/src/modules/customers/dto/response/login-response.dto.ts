import { ApiProperty } from '@nestjs/swagger';

export class CustomerUserDto {
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

  @ApiProperty({
    description: '가입일시',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'Access Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: '고객 정보',
    type: CustomerUserDto,
  })
  user: CustomerUserDto;
}

export class RefreshResponseDto {
  @ApiProperty({
    description: '새로운 Access Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: '새로운 Refresh Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}
