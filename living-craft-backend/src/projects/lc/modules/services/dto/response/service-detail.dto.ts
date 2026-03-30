import { ApiProperty } from '@nestjs/swagger';
import { IconDto } from './icon.dto';

/**
 * 서비스 상세 정보 DTO
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
    type: IconDto,
  })
  icon: IconDto;

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
}
