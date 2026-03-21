import { ApiProperty } from '@nestjs/swagger';
import { IconListDto } from '@modules/icons/dto/response/icon-list.dto';
import { ServiceableRegionDto } from './service-list.dto';

/**
 * 서비스 상세 정보 DTO (관리자용)
 * ServiceListItemDto와 유사하지만 추가 필드 포함 (isActive, sortOrder, timestamps)
 */
export class ServiceDetailDto {
  @ApiProperty({
    description: '서비스 ID',
    example: '1',
  })
  id: string;

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
    description: '아이콘 정보',
    type: IconListDto,
  })
  icon: IconListDto;

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
    description: '서비스 가능 지역 목록',
    type: [ServiceableRegionDto],
  })
  serviceableRegions: ServiceableRegionDto[];

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
