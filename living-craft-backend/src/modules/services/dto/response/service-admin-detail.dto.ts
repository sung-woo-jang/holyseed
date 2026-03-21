import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IconListDto } from '@modules/icons/dto/response/icon-list.dto';

/**
 * 관리자용 서비스 지역 DTO (수정 페이지용)
 * districtId와 estimateFee를 포함한 원본 데이터
 */
export class ServiceRegionAdminDto {
  @ApiProperty({
    description: '지역 ID (district ID)',
    example: 70,
  })
  districtId: number;

  @ApiProperty({
    description: '지역 전체 이름',
    example: '인천광역시 연수구',
  })
  districtFullName: string;

  @ApiProperty({
    description: '지역 이름',
    example: '연수구',
  })
  districtName: string;

  @ApiProperty({
    description: '출장비',
    example: 10000,
  })
  estimateFee: number;
}

/**
 * 관리자용 서비스 스케줄 DTO
 */
export class ServiceScheduleAdminDto {
  @ApiProperty({
    description: '견적 스케줄 모드',
    example: 'weekends',
  })
  estimateScheduleMode: string;

  @ApiPropertyOptional({
    description: '견적 가능 요일',
    example: ['mon', 'tue', 'wed'],
  })
  estimateAvailableDays: string[] | null;

  @ApiPropertyOptional({
    description: '견적 시작 시간',
    example: '08:00',
  })
  estimateStartTime: string | null;

  @ApiPropertyOptional({
    description: '견적 종료 시간',
    example: '17:00',
  })
  estimateEndTime: string | null;

  @ApiPropertyOptional({
    description: '견적 슬롯 간격 (분)',
    example: 60,
  })
  estimateSlotDuration: number | null;

  @ApiProperty({
    description: '시공 스케줄 모드',
    example: 'weekends',
  })
  constructionScheduleMode: string;

  @ApiPropertyOptional({
    description: '시공 가능 요일',
    example: ['mon', 'tue', 'wed', 'thu', 'fri'],
  })
  constructionAvailableDays: string[] | null;

  @ApiPropertyOptional({
    description: '시공 시작 시간',
    example: '09:00',
  })
  constructionStartTime: string | null;

  @ApiPropertyOptional({
    description: '시공 종료 시간',
    example: '18:00',
  })
  constructionEndTime: string | null;

  @ApiPropertyOptional({
    description: '시공 슬롯 간격 (분)',
    example: 60,
  })
  constructionSlotDuration: number | null;

  @ApiProperty({
    description: '예약 가능 기간 (개월)',
    example: 3,
  })
  bookingPeriodMonths: number;
}

/**
 * 관리자용 서비스 상세 DTO (수정 페이지용)
 * 폼에 필요한 모든 데이터를 원본 형태로 포함
 */
export class ServiceAdminDetailDto {
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
    description: '서비스 가능 지역 목록 (원본 데이터)',
    type: [ServiceRegionAdminDto],
  })
  regions: ServiceRegionAdminDto[];

  @ApiPropertyOptional({
    description: '서비스 스케줄',
    type: ServiceScheduleAdminDto,
  })
  schedule: ServiceScheduleAdminDto | null;

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
