import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PortfolioDetailDto {
  @ApiProperty({
    description: '포트폴리오 ID',
    example: '1',
  })
  id: string;

  @ApiProperty({
    description: '카테고리',
    example: '인테리어필름',
  })
  category: string;

  @ApiProperty({
    description: '프로젝트명',
    example: '강남 오피스텔 인테리어 필름 시공',
  })
  projectName: string;

  @ApiPropertyOptional({
    description: '고객사',
    example: '강남 오피스텔',
  })
  client?: string;

  @ApiProperty({
    description: '작업 기간',
    example: '2일',
  })
  duration: string;

  @ApiProperty({
    description: '상세 설명',
    example: '기존 싱크대와 가구를 대리석 패턴 필름으로 시공하여...',
  })
  detailedDescription: string;

  @ApiProperty({
    description: '이미지 URL 목록',
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
  })
  images: string[];

  @ApiPropertyOptional({
    description: '태그 목록',
    example: ['대리석', '싱크대', '리모델링'],
  })
  tags?: string[];

  @ApiProperty({
    description: '관련 서비스 ID',
    example: '1',
  })
  relatedServiceId: string;
}
