import { ApiProperty } from '@nestjs/swagger';

/**
 * 관리자용 서비스 목록 아이템 DTO (간소화)
 * 테이블 표시에 필요한 최소 정보만 포함
 */
export class ServiceAdminListItemDto {
  @ApiProperty({
    description: '서비스 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '서비스 제목',
    example: '인테리어 필름',
  })
  title: string;

  @ApiProperty({
    description: '서비스 설명',
    example: '고급 인테리어 필름 시공 서비스입니다.',
  })
  description: string;

  @ApiProperty({
    description: '아이콘 이름',
    example: 'icon-film',
  })
  iconName: string;

  @ApiProperty({
    description: '아이콘 배경색 (HEX)',
    example: '#E3F2FD',
  })
  iconBgColor: string;

  @ApiProperty({
    description: '아이콘 색상 (HEX)',
    example: '#424242',
  })
  iconColor: string;

  @ApiProperty({
    description: '작업 소요 시간',
    example: '하루 종일',
  })
  duration: string;

  @ApiProperty({
    description: '시공 시간 선택 필요 여부',
    example: false,
  })
  requiresTimeSelection: boolean;

  @ApiProperty({
    description: '활성화 여부',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: '정렬 순서',
    example: 1,
  })
  sortOrder: number;

  @ApiProperty({
    description: '서비스 가능 지역 수',
    example: 5,
  })
  regionsCount: number;

  @ApiProperty({
    description: '생성 일시',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: '수정 일시',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: string;
}
