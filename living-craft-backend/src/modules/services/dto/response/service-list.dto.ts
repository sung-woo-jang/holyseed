import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IconListDto } from '@modules/icons/dto/response/icon-list.dto';

export class CityDto {
  @ApiProperty({
    description: '시/군/구 ID',
    example: '1',
  })
  id: string;

  @ApiProperty({
    description: '시/군/구 이름',
    example: '강남구',
  })
  name: string;

  @ApiPropertyOptional({
    description: '출장비 (null이면 상위 지역 기본값 사용)',
    example: 15000,
  })
  estimateFee: number | null;
}

export class ServiceableRegionDto {
  @ApiProperty({
    description: '시/도 ID',
    example: '1',
  })
  id: string;

  @ApiProperty({
    description: '시/도 이름',
    example: '서울특별시',
  })
  name: string;

  @ApiProperty({
    description: '기본 출장비',
    example: 0,
  })
  estimateFee: number;

  @ApiProperty({
    description: '시/군/구 목록',
    type: [CityDto],
  })
  cities: CityDto[];
}

export class ServiceListItemDto {
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
    description: '서비스 가능 지역 목록',
    type: [ServiceableRegionDto],
  })
  serviceableRegions: ServiceableRegionDto[];
}
